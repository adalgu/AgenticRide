export interface MusicGenerationPayload {
  prompt: string;
  tags?: string;
  title?: string;
  make_instrumental?: boolean;
  wait_audio?: boolean;
}

export interface MusicResponse {
  id: string;
  audio_url: string;
  status: string;
}
