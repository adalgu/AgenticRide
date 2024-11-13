import { useRef, useCallback, useEffect } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../../lib/wavtools';
import { instructions } from '../../utils/conversation_config';

interface UseRealtimeClientProps {
  apiKey: string;
  localRelayServerUrl: string;
  onEvent: (event: any) => void;
  onConversationUpdate: (data: any) => void;
  onError: (error: any) => void;
  onGenerateMusic: (params: {
    prompt: string;
    make_instrumental?: boolean;
    wait_audio?: boolean;
  }) => Promise<any>;
}

interface GenerateLyricsParams {
  theme: string;
  style?: string;
  mood?: string;
  title?: string;
}

interface GenerateMusicParams {
  prompt: string;
  make_instrumental?: boolean;
  wait_audio?: boolean;
  tags?: string;
  title?: string;
}

interface APIResponse<T> {
  data?: T;
  error?: string;
  status: 'pending' | 'complete' | 'error';
}

// 이벤트 관련 인터페이스
interface ClientErrorEvent {
  type: string;
  message: string;
  error?: Error;
}

interface ConversationItem {
  type: 'message' | 'function_call' | 'function_call_output';
  role?: 'system' | 'user' | 'assistant';
  name?: string;
  status?: 'in_progress' | 'completed';
}

interface ConversationDelta {
  audio?: Int16Array;
  transcript?: string;
  arguments?: string;
}

interface ConversationUpdateEvent {
  item: ConversationItem;
  delta?: ConversationDelta;
}

const SUNO_API_BASE_URL = 'https://suno-api-ochre-six.vercel.app';
const TOOL_INITIALIZATION_DELAY = 5000; // 5초 대기
const ASSISTANT_TRACK_ID = 'assistant-response';

export function useRealtimeClient({
  apiKey,
  localRelayServerUrl,
  onEvent,
  onConversationUpdate,
  onError,
  onGenerateMusic,
}: UseRealtimeClientProps) {
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient(
      localRelayServerUrl
        ? { url: localRelayServerUrl }
        : {
            apiKey: apiKey,
            dangerouslyAllowAPIKeyInBrowser: true,
          }
    )
  );

  // 도구 목록 관리
  const toolsRef = useRef<Set<string>>(new Set());

  // 현재 진행 중인 작업 상태 관리
  const activeOperationRef = useRef<{
    type: string;
    status: 'in_progress' | 'completed';
    timestamp: number;
  } | null>(null);

  // 도구 초기화 상태 확인
  const verifyToolInitialization = async (
    toolName: string
  ): Promise<boolean> => {
    if (toolsRef.current.has(toolName)) {
      return true;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, TOOL_INITIALIZATION_DELAY)
    );

    return toolsRef.current.has(toolName);
  };

  // API 호출을 위한 재시도 로직
  const retryFetch = async (
    url: string,
    options: RequestInit,
    maxRetries = 3,
    delay = 1000
  ): Promise<Response> => {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;

        throw new Error(`API call failed: ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, delay * Math.pow(2, i))
          );
        }
      }
    }

    throw lastError || new Error('Failed after max retries');
  };

  // VAD 입력 처리 함수
  const handleVADInput = useCallback(async (data: { mono: Int16Array }) => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    // 녹음 상태 확인
    const recordingStatus = wavRecorder.getStatus();
    if (recordingStatus !== 'recording') {
      return;
    }

    // 현재 재생 중인 오디오 중단
    const trackOffset = await wavStreamPlayer.interrupt();
    if (trackOffset?.trackId === ASSISTANT_TRACK_ID) {
      await client.cancelResponse(trackOffset.trackId, trackOffset.offset);
    }

    // 입력 오디오 전송
    client.appendInputAudio(data.mono);
  }, []);

  const connectConversation = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    // Connect to microphone
    await wavRecorder.begin();

    // Connect to audio output
    await wavStreamPlayer.connect();

    // Set up client event handlers with improved conversation flow control
    client.on('error', (event: ClientErrorEvent) => {
      console.error('Client error:', event);
      onError(event);
    });

    // 사용자가 말하기 시작할 때 이전 오디오 재생 중단
    client.on('conversation.interrupted', async () => {
      await wavStreamPlayer.interrupt();
      if (activeOperationRef.current) {
        activeOperationRef.current.status = 'completed';
      }
    });

    // 대화 업데이트 처리 개선
    client.on(
      'conversation.updated',
      async ({ item, delta }: ConversationUpdateEvent) => {
        const items = client.conversation.getItems();

        switch (item.type) {
          case 'message':
            // 메시지 타입별 처리
            if (item.role === 'assistant' && delta?.audio) {
              // 현재 녹음 중이면 일시 중지
              if (wavRecorder.getStatus() === 'recording') {
                await wavRecorder.pause();
              }

              // 음성 응답 처리
              const audioBuffer = new Int16Array(delta.audio);
              wavStreamPlayer.add16BitPCM(audioBuffer, ASSISTANT_TRACK_ID);
            }
            break;

          case 'function_call':
            // 함수 호출 시작 시 상태 업데이트
            activeOperationRef.current = {
              type: item.name || '',
              status: 'in_progress',
              timestamp: Date.now(),
            };
            break;

          case 'function_call_output':
            // 함수 호출 완료 시 상태 업데이트
            if (activeOperationRef.current && item.name) {
              if (activeOperationRef.current.type === item.name) {
                activeOperationRef.current.status = 'completed';
              }
            }
            break;
        }

        onConversationUpdate({ item, delta });
      }
    );

    // 아이템 추가 완료 시 처리
    client.on(
      'conversation.item.completed',
      async ({ item }: { item: ConversationItem }) => {
        if (item.type === 'function_call_output' && item.name) {
          // 함수 호출 완료 후 처리
          const operation = activeOperationRef.current;
          if (operation && operation.type === item.name) {
            const duration = Date.now() - operation.timestamp;
            console.log(`Operation ${item.name} completed in ${duration}ms`);
            activeOperationRef.current = null;
          }
        } else if (item.type === 'message' && item.role === 'assistant') {
          // 어시스턴트 메시지 완료 후 녹음 재개
          if (client.getTurnDetectionType() === 'server_vad') {
            await wavRecorder.record(handleVADInput);
          }
        }
      }
    );

    // Connect to realtime API
    await client.connect();

    // Set instructions and transcription
    client.updateSession({ instructions: instructions });
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });

    // Add lyrics generation tool with improved initialization check
    const addLyricsTool = async () => {
      client.addTool(
        {
          name: 'generate_lyrics',
          description:
            '음악 가사를 생성합니다. 주제와 스타일을 설명하면 Suno 3.5 버전에 맞는 가사를 만들어줍니다.',
          parameters: {
            type: 'object',
            properties: {
              theme: {
                type: 'string',
                description: '가사의 주제나 이야기 내용',
              },
              style: {
                type: 'string',
                description: '가사의 스타일 (예: 동요, 팝송, 발라드)',
                default: '',
              },
              mood: {
                type: 'string',
                description: '가사의 분위기 (예: 밝은, 감성적인, 희망적인)',
                default: '',
              },
              title: {
                type: 'string',
                description: '노래 제목',
                default: '',
              },
            },
            required: ['theme'],
          },
        },
        async (params: GenerateLyricsParams): Promise<APIResponse<any>> => {
          try {
            const isInitialized = await verifyToolInitialization(
              'generate_lyrics'
            );
            if (!isInitialized) {
              throw new Error(
                'generate_lyrics tool is not properly initialized'
              );
            }

            const response = await retryFetch(
              `${SUNO_API_BASE_URL}/api/generate_lyrics`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  prompt: `${params.theme} ${params.style || ''} ${
                    params.mood || ''
                  } ${params.title || ''}`.trim(),
                }),
              }
            );

            const result = await response.json();

            if (!result || typeof result !== 'object') {
              throw new Error('Invalid response format');
            }

            return {
              data: result,
              status: 'complete',
            };
          } catch (error) {
            console.error('Lyrics generation failed:', error);
            return {
              error:
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred',
              status: 'error',
            };
          }
        }
      );

      toolsRef.current.add('generate_lyrics');
      return await verifyToolInitialization('generate_lyrics');
    };

    const lyricsToolInitialized = await addLyricsTool();
    if (!lyricsToolInitialized) {
      console.error('Failed to initialize generate_lyrics tool');
      onError(new Error('Failed to initialize generate_lyrics tool'));
    }

    // Add music generation tool with improved initialization check
    const addMusicTool = async () => {
      client.addTool(
        {
          name: 'generate_music',
          description:
            '음성으로 음악을 생성합니다. 음악 스타일이나 분위기를 설명하면 AI가 음악을 만들어줍니다.',
          parameters: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: '음악 스타일이나 분위기에 대한 설명',
              },
              make_instrumental: {
                type: 'boolean',
                description: '반주만 생성할지 여부',
                default: false,
              },
              wait_audio: {
                type: 'boolean',
                description: '음악 생성 완료까지 대기할지 여부',
                default: false,
              },
              tags: {
                type: 'string',
                description:
                  '음악 장르에 대한 정보 (예: children cheerful happy sweet)',
                default: '',
              },
              title: {
                type: 'string',
                description: '음악 제목',
                default: '',
              },
            },
            required: ['prompt'],
          },
        },
        async (params: GenerateMusicParams): Promise<APIResponse<any>> => {
          try {
            const isInitialized = await verifyToolInitialization(
              'generate_music'
            );
            if (!isInitialized) {
              throw new Error(
                'generate_music tool is not properly initialized'
              );
            }

            const response = await retryFetch(
              `${SUNO_API_BASE_URL}/api/custom_generate`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  prompt: params.prompt,
                  make_instrumental: params.make_instrumental || false,
                  wait_audio: params.wait_audio || false,
                  tags: params.tags || '',
                  title: params.title || '',
                }),
              }
            );

            const result = await response.json();

            if (!Array.isArray(result)) {
              throw new Error('Invalid response format');
            }

            return {
              data: result.map((item) => ({
                title: item.title,
                audio_url: item.audio_url,
                status: item.status,
              })),
              status: 'complete',
            };
          } catch (error) {
            console.error('Music generation failed:', error);
            return {
              error:
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred',
              status: 'error',
            };
          }
        }
      );

      toolsRef.current.add('generate_music');
      return await verifyToolInitialization('generate_music');
    };

    const musicToolInitialized = await addMusicTool();
    if (!musicToolInitialized) {
      console.error('Failed to initialize generate_music tool');
      onError(new Error('Failed to initialize generate_music tool'));
    }

    // Send initial message
    client.sendUserMessageContent([
      {
        type: 'input_text',
        text: '안녕?',
      },
    ]);

    // VAD 모드에서만 오디오 입력 처리
    if (client.getTurnDetectionType() === 'server_vad') {
      await wavRecorder.record(handleVADInput);
    }
  }, [onEvent, onConversationUpdate, onError, onGenerateMusic, handleVADInput]);

  const disconnectConversation = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    client.disconnect();
    await wavRecorder.end();
    await wavStreamPlayer.interrupt();
  }, []);

  const startRecording = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    const trackSampleOffset = await wavStreamPlayer.interrupt();
    if (trackSampleOffset?.trackId) {
      const { trackId, offset } = trackSampleOffset;
      await client.cancelResponse(trackId, offset);
    }
    await wavRecorder.record(handleVADInput);
  }, [handleVADInput]);

  const stopRecording = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;

    await wavRecorder.pause();
    client.createResponse();
  }, []);

  return {
    client: clientRef.current,
    wavRecorder: wavRecorderRef.current,
    wavStreamPlayer: wavStreamPlayerRef.current,
    connectConversation,
    disconnectConversation,
    startRecording,
    stopRecording,
  };
}
