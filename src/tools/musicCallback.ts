import { ToolDefinition } from '../types/tools';
import { SUNO_API_BASE_URL, retryFetch } from '../utils/api';

export interface MusicCallbackParams {
  music_id: string;
}

interface MusicInfo {
  id: string;
  title: string;
  image_url: string;
  lyric: string;
  audio_url: string;
  video_url: string;
  created_at: string;
  model_name: string;
  status: string;
  gpt_description_prompt: string;
  prompt: string;
  type: string;
  tags: string;
}

export interface MusicCallbackResponse {
  data?: MusicInfo;
  error?: string;
  status: 'pending' | 'complete' | 'error';
}

export const musicCallbackTool: ToolDefinition = {
  name: 'process_music_callback',
  description: '음악 생성 결과를 확인하고 처리합니다.',
  parameters: {
    type: 'object',
    properties: {
      music_id: {
        type: 'string',
        description: '확인할 음악의 ID',
      },
    },
    required: ['music_id'],
  },
  handler: async (params: {
    [key: string]: any;
  }): Promise<MusicCallbackResponse> => {
    try {
      const { music_id } = params as MusicCallbackParams;

      const response = await retryFetch(
        `${SUNO_API_BASE_URL}/api/get?ids=${music_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('Invalid response format');
      }

      // API 응답에서 해당 music_id의 정보 추출
      const musicInfo = result[0][0] as MusicInfo;

      if (!musicInfo) {
        throw new Error('Music info not found');
      }

      return {
        data: musicInfo,
        status: musicInfo.status === 'complete' ? 'complete' : 'pending',
      };
    } catch (error) {
      console.error('Music callback processing failed:', error);
      return {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
      };
    }
  },
};
