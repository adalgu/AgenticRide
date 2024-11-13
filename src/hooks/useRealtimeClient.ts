import { useEffect } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js';
import { instructions } from '../utils/conversation_config.js';
import { RealtimeEvent, MemoryKV, Coordinates } from '../types/console';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { setMemoryTool } from '../tools/memory';
import { getWeatherTool } from '../tools/weather';
import { lyricsGenerationTool } from '../tools/lyrics';
import { musicGenerationTool } from '../tools/music';
import { musicCallbackTool } from '../tools/musicCallback';

interface UseRealtimeClientProps {
  client: RealtimeClient;
  wavStreamPlayer: WavStreamPlayer;
  setRealtimeEvents: (fn: (events: RealtimeEvent[]) => RealtimeEvent[]) => void;
  setItems: (items: ItemType[]) => void;
  setMemoryKv: (fn: (kv: MemoryKV) => MemoryKV) => void;
  setMarker: (coords: Coordinates | null) => void;
  setCoords: (coords: Coordinates) => void;
}

export const useRealtimeClient = ({
  client,
  wavStreamPlayer,
  setRealtimeEvents,
  setItems,
  setMemoryKv,
  setMarker,
  setCoords,
}: UseRealtimeClientProps) => {
  useEffect(() => {
    client.updateSession({ instructions });
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });

    // Add tools
    const memoryTool = setMemoryTool(setMemoryKv);
    const weatherTool = getWeatherTool(setMarker, setCoords);

    client.addTool(
      {
        name: memoryTool.name,
        description: memoryTool.description,
        parameters: memoryTool.parameters,
      },
      memoryTool.handler
    );

    client.addTool(
      {
        name: weatherTool.name,
        description: weatherTool.description,
        parameters: weatherTool.parameters,
      },
      weatherTool.handler
    );

    // Add lyrics generation tool
    client.addTool(
      {
        name: lyricsGenerationTool.name,
        description: lyricsGenerationTool.description,
        parameters: lyricsGenerationTool.parameters,
      },
      lyricsGenerationTool.handler
    );

    // Add music generation tool
    client.addTool(
      {
        name: musicGenerationTool.name,
        description: musicGenerationTool.description,
        parameters: musicGenerationTool.parameters,
      },
      musicGenerationTool.handler
    );

    // Add music callback tool
    client.addTool(
      {
        name: musicCallbackTool.name,
        description: musicCallbackTool.description,
        parameters: musicCallbackTool.parameters,
      },
      musicCallbackTool.handler
    );

    client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
      setRealtimeEvents((realtimeEvents) => {
        const lastEvent = realtimeEvents[realtimeEvents.length - 1];
        if (lastEvent?.event.type === realtimeEvent.event.type) {
          lastEvent.count = (lastEvent.count || 0) + 1;
          return realtimeEvents.slice(0, -1).concat(lastEvent);
        } else {
          return realtimeEvents.concat(realtimeEvent);
        }
      });
    });

    client.on('error', (event: any) => console.error(event));

    client.on('conversation.interrupted', async () => {
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
    });

    client.on('conversation.updated', async ({ item, delta }: any) => {
      const items = client.conversation.getItems();
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      if (item.status === 'completed' && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000
        );
        item.formatted.file = wavFile;
      }
      setItems(items);
    });

    setItems(client.conversation.getItems());

    return () => {
      client.reset();
    };
  }, [
    client,
    wavStreamPlayer,
    setRealtimeEvents,
    setItems,
    setMemoryKv,
    setMarker,
    setCoords,
  ]);
};
