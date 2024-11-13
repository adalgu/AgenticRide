import { useState } from 'react';
import { MusicResponse } from './types';

interface MusicDisplayProps {
  musicResponses: MusicResponse[];
}

export function MusicDisplay({ musicResponses }: MusicDisplayProps) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  if (!musicResponses.length) {
    return (
      <div className="content-block music">
        <div className="content-block-title">generate_music()</div>
        <div className="content-block-body">
          음악이 생성되지 않았습니다. 음성으로 음악 생성을 요청해보세요.
        </div>
      </div>
    );
  }

  return (
    <div className="content-block music">
      <div className="content-block-title">generate_music()</div>
      <div className="content-block-body">
        <div className="music-versions">
          {musicResponses.map((response, index) => (
            <div key={response.id} className="music-version">
              <h4>버전 {index + 1}</h4>
              {response.status === 'streaming' ? (
                <div>
                  <audio
                    controls
                    src={response.audio_url}
                    onPlay={() => setSelectedVersion(index)}
                  />
                </div>
              ) : (
                <div>생성 중...</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
