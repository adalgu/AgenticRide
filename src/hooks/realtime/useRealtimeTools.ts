import { useCallback } from 'react';
import { RealtimeToolsProps } from './types';
import { setMemoryTool } from '../../tools/memory';
import { getWeatherTool } from '../../tools/weather';
import { lyricsGenerationTool } from '../../tools/generateLyrics';
import { musicGenerationTool } from '../../tools/generateMusic';
import { musicCallbackTool } from '../../tools/musicCallback';
import { ToolDefinition } from '../../types/tools';

export const useRealtimeTools = ({
  client,
  setMemoryKv,
  setMarker,
  setCoords,
}: RealtimeToolsProps) => {
  const registerTool = useCallback(
    (tool: ToolDefinition) => {
      client.addTool(
        {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
        tool.handler
      );
    },
    [client]
  );

  const initializeTools = useCallback(() => {
    // System tools
    const memoryTool = setMemoryTool(setMemoryKv);
    const weatherTool = getWeatherTool(setMarker, setCoords);
    registerTool(memoryTool);
    registerTool(weatherTool);

    // Music generation tools
    registerTool(lyricsGenerationTool);
    registerTool(musicGenerationTool);
    registerTool(musicCallbackTool);
  }, [client, setMemoryKv, setMarker, setCoords, registerTool]);

  return {
    initializeTools,
    registerTool,
  };
};
