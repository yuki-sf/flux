import React, { useState, useEffect, useRef } from 'react';
import type { CourseVideo } from '../types';
import { Play, Pause, RotateCcw, CheckCircle, Clock, ListVideo, SkipBack, SkipForward } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

interface YouTubePlayerProps {
  video: CourseVideo;
  playlistTotal?: number;
  playlistSeriesId?: string;
  onProgressUpdate: (currentTime: number, completed: boolean) => void;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  video,
  playlistTotal,
  playlistSeriesId,
  onProgressUpdate,
  onNextVideo,
  onPrevVideo
}) => {
  const storageKey = playlistSeriesId ? `yt_time_series_${playlistSeriesId}` : `yt_time_video_${video.id}`;
  
  // Retrieve persistent stored timestamp mapping so resuming starts directly from exact stopped point
  const getInitialCachedTime = () => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) return Number(cached);
      } catch (e) {
        // ignore storage cache checks
      }
    }
    return 0;
  };

  const [currentTime, setCurrentTime] = useState<number>(getInitialCachedTime);
  const [exactDurationSeconds, setExactDurationSeconds] = useState<number>(video.durationSeconds || 0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState<number>(0);
  const [playlistArrayLength, setPlaylistArrayLength] = useState<number>(playlistTotal || 1);

  const playerRef = useRef<any>(null);
  const containerId = useRef(`yt-player-${Math.random().toString(36).substr(2, 6)}`);

  // Load YouTube Iframe API script dynamically and instantiate player initializing cached resume time
  useEffect(() => {
    let isMounted = true;
    const initialResumeTime = getInitialCachedTime();
    setCurrentTime(initialResumeTime);

    const initializePlayer = () => {
      if (!isMounted) return;
      
      // Destroy prior instance if present to clean up memory
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying previous YouTube Player instance', e);
        }
      }

      const playerVars: any = {
        autoplay: 1,
        rel: 0,
        enablejsapi: 1,
        modestbranding: 1,
        start: Math.floor(initialResumeTime)
      };

      const config: any = {
        height: '100%',
        width: '100%',
        playerVars,
        events: {
          onReady: (event: any) => {
            if (!isMounted) return;
            const dur = event.target.getDuration();
            if (dur) setExactDurationSeconds(Math.round(dur));

            if (typeof event.target.getPlaylistIndex === 'function') {
              const idx = event.target.getPlaylistIndex();
              setCurrentPlaylistIndex(idx);
            }
            if (typeof event.target.getPlaylist === 'function') {
              const listArr = event.target.getPlaylist();
              if (listArr && listArr.length > 0) {
                setPlaylistArrayLength(listArr.length);
              }
            }
          },
          onStateChange: (event: any) => {
            if (!isMounted) return;
            // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (event.data === 1) {
              setIsPlaying(true);
              const dur = event.target.getDuration();
              if (dur) setExactDurationSeconds(Math.round(dur));

              if (typeof event.target.getPlaylistIndex === 'function') {
                const idx = event.target.getPlaylistIndex();
                setCurrentPlaylistIndex(idx);
              }
              if (typeof event.target.getPlaylist === 'function') {
                const listArr = event.target.getPlaylist();
                if (listArr && listArr.length > 0) {
                  setPlaylistArrayLength(listArr.length);
                }
              }
            } else if (event.data === 0) {
              setIsPlaying(false);
              setIsCompleted(true);
              onProgressUpdate(exactDurationSeconds, true);
              // Clear stored position on sequence completion
              if (typeof window !== 'undefined') {
                localStorage.removeItem(storageKey);
              }
            } else {
              setIsPlaying(false);
            }
          }
        }
      };

      if (playlistSeriesId) {
        config.playerVars.listType = 'playlist';
        config.playerVars.list = playlistSeriesId;
      } else {
        config.videoId = video.id;
      }

      playerRef.current = new window.YT.Player(containerId.current, config);
    };

    if (typeof window !== 'undefined') {
      if (window.YT && window.YT.Player) {
        initializePlayer();
      } else {
        const scriptUrl = 'https://www.youtube.com/iframe_api';
        const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
        
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.src = scriptUrl;
          const firstScriptTag = document.getElementsByTagName('script')[0];
          if (firstScriptTag && firstScriptTag.parentNode) {
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
          } else {
            document.head.appendChild(tag);
          }
        }

        const prevCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (typeof prevCallback === 'function') prevCallback();
          initializePlayer();
        };
      }
    }

    return () => {
      isMounted = false;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore cleanup aborts
        }
      }
    };
  }, [video.id, playlistSeriesId, storageKey]);

  // Automated synchronization timer interval retrieving live current position and saving persistence state
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const time = playerRef.current.getCurrentTime();
          if (time !== undefined && time > 0) {
            const sec = Math.round(time);
            setCurrentTime(sec);
            
            // Periodically synchronize position mapping to browser localStorage
            if (typeof window !== 'undefined' && sec % 2 === 0) {
              localStorage.setItem(storageKey, sec.toString());
            }

            // Check real live duration
            const dur = playerRef.current.getDuration();
            if (dur && Math.round(dur) !== exactDurationSeconds) {
              setExactDurationSeconds(Math.round(dur));
            }

            // Sync index mapping dynamically
            if (typeof playerRef.current.getPlaylistIndex === 'function') {
              const idx = playerRef.current.getPlaylistIndex();
              if (idx !== currentPlaylistIndex) setCurrentPlaylistIndex(idx);
            }

            // Update host container logic
            onProgressUpdate(sec, isCompleted);
          }
        } catch (e) {
          // player instance state change transition guard
        }
      }
    }, 500);

    return () => clearInterval(timer);
  }, [exactDurationSeconds, isCompleted, currentPlaylistIndex, onProgressUpdate, storageKey]);

  // Format integer total cleanly into mm:ss or hh:mm:ss strings
  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handleSeekManual = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(val, true);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, val.toString());
    }
    onProgressUpdate(val, isCompleted);
  };

  const togglePlaybackState = () => {
    if (playerRef.current) {
      if (isPlaying) {
        if (typeof playerRef.current.pauseVideo === 'function') playerRef.current.pauseVideo();
      } else {
        if (typeof playerRef.current.playVideo === 'function') playerRef.current.playVideo();
      }
    }
  };

  const toggleComplete = () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);
    if (nextState) {
      onProgressUpdate(exactDurationSeconds, true);
    } else {
      onProgressUpdate(currentTime, false);
    }
  };

  // Skip tracks backward/forward logic wrapper supporting playlist loops and discrete links
  const triggerNextVideo = () => {
    if (playlistSeriesId && playerRef.current && typeof playerRef.current.nextVideo === 'function') {
      playerRef.current.nextVideo();
    } else if (onNextVideo) {
      onNextVideo();
    }
  };

  const triggerPrevVideo = () => {
    if (playlistSeriesId && playerRef.current && typeof playerRef.current.previousVideo === 'function') {
      playerRef.current.previousVideo();
    } else if (onPrevVideo) {
      onPrevVideo();
    }
  };

  const showNavButtons = playlistSeriesId || onNextVideo || onPrevVideo;

  return (
    <div className="video-player-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0 }}>
      {/* Premium responsive 16:9 embedded node parent */}
      <div 
        style={{ 
          position: 'relative', 
          width: '100%', 
          paddingTop: '56.25%', 
          backgroundColor: '#000', 
          borderRadius: '10px',
          overflow: 'hidden'
        }}
      >
        <div
          id={containerId.current}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none'
          }}
        />
      </div>

      {/* Glassmorphic automated tracking monitor bar */}
      <div 
        className="glass-panel" 
        style={{ 
          marginTop: '12px', 
          padding: '12px 16px', 
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              {/* Display Playlist Video Counter clearly as requested */}
              {playlistSeriesId && (
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ListVideo size={13} />
                  <span>{currentPlaylistIndex + 1} / {playlistArrayLength > 1 ? playlistArrayLength : playlistTotal || '—'}</span>
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
              {video.title}
            </h2>
          </div>

          {/* Viewing exact duration format stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            {/* Embedded navigation action blocks */}
            {showNavButtons && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <button
                  onClick={triggerPrevVideo}
                  title="Jump to previous video"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 500 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <SkipBack size={13} />
                  <span>Prev</span>
                </button>
                <button
                  onClick={triggerNextVideo}
                  title="Jump to next video"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 500 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>Next</span>
                  <SkipForward size={13} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '6px' }}>
              <Clock size={14} />
              <span>{formatSeconds(currentTime)} / {formatSeconds(exactDurationSeconds)}</span>
            </div>
          </div>
        </div>


        {/* Real-time slider mapping */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={togglePlaybackState}
            style={{
              background: isPlaying ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
              fontSize: '12px'
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <input
            type="range"
            min={0}
            max={exactDurationSeconds || 100}
            value={currentTime}
            onChange={handleSeekManual}
            style={{
              flex: 1,
              accentColor: 'var(--accent-primary)',
              cursor: 'pointer',
              height: '6px',
              background: '#374151',
              borderRadius: '3px'
            }}
          />

          <button
            onClick={toggleComplete}
            style={{
              background: isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              border: `1px solid ${isCompleted ? '#10b981' : '#4b5563'}`,
              color: isCompleted ? '#10b981' : '#9ca3af',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle size={14} />
          </button>

          <button
            onClick={() => {
              if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                playerRef.current.seekTo(0, true);
              }
              setCurrentTime(0);
              setIsCompleted(false);
              if (typeof window !== 'undefined') {
                localStorage.setItem(storageKey, '0');
              }
            }}
            title="Replay from start"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              padding: '6px'
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
