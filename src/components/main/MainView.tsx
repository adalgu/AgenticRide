import React from 'react';
import { useConsole } from '../../contexts/ConsoleContext';
import './MainView.scss';

export function MainView() {
  const { canvasKv } = useConsole();

  const renderStoryContent = () => {
    if (
      !canvasKv.stories ||
      !Array.isArray(canvasKv.stories) ||
      canvasKv.stories.length === 0
    ) {
      return <div className="empty-message">No story content yet</div>;
    }

    return (
      <div className="stories-container">
        {canvasKv.stories.map((story: string, index: number) => (
          <div key={index} className="story-content">
            {story.includes('<') ? (
              <div dangerouslySetInnerHTML={{ __html: story }} />
            ) : (
              story
            )}
            {index < canvasKv.stories.length - 1 && (
              <div className="story-divider" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderMusicContent = () => {
    const music = canvasKv.music;
    if (!music) return null;

    return (
      <div className="music-container">
        {/* Image Section */}
        <div className="music-image-section">
          {music.status.image === 'pending' ? (
            <div className="loading">Generating image...</div>
          ) : music.image_url ? (
            <img src={music.image_url} alt="Generated music artwork" />
          ) : null}
        </div>

        {/* Lyrics Section */}
        {music.lyric && (
          <div className="music-lyrics-section">
            <p>{music.lyric}</p>
          </div>
        )}

        {/* Audio Section */}
        {music.status.audio === 'pending' ? (
          <div className="loading">Generating audio...</div>
        ) : music.audio_url ? (
          <div className="music-audio-section">
            <audio controls>
              <source src={music.audio_url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        ) : null}

        {/* Video Section */}
        {music.status.video === 'pending' ? (
          <div className="loading">Generating video...</div>
        ) : music.video_url ? (
          <div className="music-video-section">
            <video controls width="100%">
              <source src={music.video_url} type="video/mp4" />
              Your browser does not support the video element.
            </video>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="main-view">
      <div className="content-block-title">Story View</div>
      <div className="content-block-body">
        {renderStoryContent()}
        {renderMusicContent()}
      </div>
    </div>
  );
}
