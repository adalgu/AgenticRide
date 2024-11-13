import { useRef } from 'react';
import { useAudioVisualization } from '../hooks/useAudioVisualization';
import { useRealtimeClient } from '../hooks/useRealtimeClient';
import { useScrollEffect } from '../hooks/useScrollEffect';
import { useConsoleInitialization } from '../hooks/useConsoleInitialization';
import { ConsoleProvider } from '../contexts/ConsoleContext';
import { Header } from '../components/header/Header';
import { Events } from '../components/console/Events';
import { Conversation } from '../components/console/Conversation';
import { ConsoleActions } from '../components/console/ConsoleActions';
import { WeatherMap } from '../components/weather/WeatherMap';
import { MemoryView } from '../components/memory/MemoryView';
import { useConsole } from '../contexts/ConsoleContext';
import { LOCAL_RELAY_SERVER_URL } from '../constants/config';

import './ConsolePage.scss';

function ConsoleContent() {
  const {
    wavRecorder,
    wavStreamPlayer,
    client,
    clientCanvasRef,
    serverCanvasRef,
    realtimeEvents,
    items,
    marker,
    coords,
    memoryKv,
    setRealtimeEvents,
    setItems,
    setMemoryKv,
    setMarker,
    setCoords,
  } = useConsole();

  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const eventsScrollHeightRef = useRef(0);

  useAudioVisualization(
    clientCanvasRef,
    serverCanvasRef,
    wavRecorder,
    wavStreamPlayer
  );

  useRealtimeClient({
    client,
    wavStreamPlayer,
    setRealtimeEvents,
    setItems,
    setMemoryKv,
    setMarker,
    setCoords,
  });

  useScrollEffect(
    eventsScrollRef,
    eventsScrollHeightRef,
    realtimeEvents,
    items
  );

  return (
    <div className="content-main">
      <div className="content-logs" ref={eventsScrollRef}>
        <Events />
        <Conversation />
        <ConsoleActions />
      </div>
      <div className="content-right">
        <WeatherMap marker={marker} coords={coords} />
        <MemoryView memoryKv={memoryKv} />
      </div>
    </div>
  );
}

export function ConsolePage() {
  const { apiKey, resetAPIKey } = useConsoleInitialization();

  return (
    <ConsoleProvider apiKey={apiKey} relayServerUrl={LOCAL_RELAY_SERVER_URL}>
      <div data-component="ConsolePage">
        <Header apiKey={apiKey} onResetApiKey={resetAPIKey} />
        <ConsoleContent />
      </div>
    </ConsoleProvider>
  );
}
