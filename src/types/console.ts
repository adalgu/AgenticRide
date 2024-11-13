import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';

export interface Coordinates {
  lat: number;
  lng: number;
  location?: string;
  temperature?: {
    value: number;
    units: string;
  };
  wind_speed?: {
    value: number;
    units: string;
  };
}

export interface RealtimeEvent {
  time: string;
  source: 'client' | 'server';
  count?: number;
  event: { [key: string]: any };
}

export interface MemoryKV {
  [key: string]: any;
}

export interface ConversationItemProps {
  item: ItemType;
  onDelete: (id: string) => void;
}

export interface EventLogProps {
  event: RealtimeEvent;
  formatTime: (timestamp: string) => string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}
