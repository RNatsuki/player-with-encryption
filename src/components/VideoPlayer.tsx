'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
// @ts-ignore
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  videoId: string;
  episodeId?: string;
}

export default function VideoPlayer({ videoId, episodeId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [videoInfo, setVideoInfo] = useState<{ duration: number; currentTime: number }>({ duration: 0, currentTime: 0 });
  const [progressLoaded, setProgressLoaded] = useState(false);
  const lastSavedProgress = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Load progress for both episodes and movies
    const loadProgress = async () => {
      try {
        if (episodeId) {
          // const res = await fetch(`/api/progress/${episodeId}`);
          // const data = await res.json();
          // if (data.progress) {
          //   setProgress(data.progress);
          //   lastSavedProgress.current = data.progress;
          // }
        } else if (videoId) {
          // Load movie progress
          // const res = await fetch(`/api/progress/movie/${videoId}`);
          // const data = await res.json();
          // if (data.progress) {
          //   setProgress(data.progress);
          //   lastSavedProgress.current = data.progress;
          // }
        }
      } catch (err) {
        console.error('Failed to load progress', err);
      } finally {
        setProgressLoaded(true);
      }
    };

    loadProgress();
  }, [episodeId, videoId]);

  useEffect(() => {
    if (!mounted || !videoRef.current || !progressLoaded) return;

    const options = {
      autoplay: false,
      controls: true,
      responsive: true,
      fluid: true,
      preload: 'metadata',
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      html5: {
        hls: {
          overrideNative: !videojs.browser.IS_SAFARI,
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
        },
      },
      sources: [{
        src: `/api/videos/${videoId}/playlist`,
        type: 'application/x-mpegURL',
      }],
    };

    playerRef.current = videojs(videoRef.current, options, function onPlayerReady() {
      console.log('Player is ready');

      // Add custom controls
      addCustomControls();

      // Add keyboard shortcuts
      addKeyboardShortcuts();

      // Add volume controls
      addVolumeControls();
    });

    // Handle errors
    playerRef.current.on('error', () => {
      console.error('VideoJS error:', playerRef.current.error());
    });

    playerRef.current.on('loadeddata', () => {
      console.log('Video loaded');
      setVideoInfo({
        duration: playerRef.current.duration(),
        currentTime: playerRef.current.currentTime()
      });
      setVolume(playerRef.current.volume());
      setIsMuted(playerRef.current.muted());

      // Apply progress after video is loaded
      if (progress > 0) {
        const duration = playerRef.current.duration();
        // Convert percentage back to time in seconds
        const timeInSeconds = (progress / 100) * duration;
        console.log('Setting progress to:', timeInSeconds, 'seconds (', progress, '% of', duration, 'seconds)');
        playerRef.current.currentTime(timeInSeconds);
      }
    });

    // Update video info
    playerRef.current.on('timeupdate', () => {
      setVideoInfo(prev => ({
        ...prev,
        currentTime: playerRef.current.currentTime()
      }));
    });

    // Update volume state
    playerRef.current.on('volumechange', () => {
      setVolume(playerRef.current.volume());
      setIsMuted(playerRef.current.muted());
    });

    // Update playback rate state
    playerRef.current.on('ratechange', () => {
      setPlaybackRate(playerRef.current.playbackRate());
    });

    // Save progress periodically (for both episodes and movies)
    let saveInterval: NodeJS.Timeout | null = null;
    // if (episodeId || videoId) {
    //   saveInterval = setInterval(() => {
    //     if (playerRef.current) {
    //       const currentTime = playerRef.current.currentTime();
    //       const duration = playerRef.current.duration();
    //       if (duration > 0) {
    //         const currentProgressPercentage = (currentTime / duration) * 100;
    //         const diff = Math.abs(currentProgressPercentage - lastSavedProgress.current);
    //         if (diff > 5) { // Save if changed more than 5%
    //           saveProgress(currentTime);
    //           lastSavedProgress.current = currentProgressPercentage;
    //         }
    //       }
    //     }
    //   }, 10000); // Check every 10 seconds

    //   // Save on pause
    //   playerRef.current.on('pause', () => {
    //     const currentTime = playerRef.current.currentTime();
    //     saveProgress(currentTime);
    //     const duration = playerRef.current.duration();
    //     if (duration > 0) {
    //       lastSavedProgress.current = (currentTime / duration) * 100;
    //     }
    //   });

    //   // Save on end
    //   playerRef.current.on('ended', () => {
    //     saveProgress(0); // Reset progress on end
    //     lastSavedProgress.current = 0;
    //   });
    // }

    return () => {
      if (saveInterval) {
        clearInterval(saveInterval);
      }
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [videoId, mounted, progressLoaded]); // Added progressLoaded to deps

  const addCustomControls = () => {
    if (!playerRef.current) return;

    const controlBar = playerRef.current.getChild('controlBar');

    // Add skip backward button using DOM manipulation
    const skipBackwardButton = document.createElement('button');
    skipBackwardButton.className = 'vjs-skip-backward vjs-control vjs-button';
    skipBackwardButton.innerHTML = `
      <span class="vjs-icon-placeholder" aria-hidden="true"></span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 19l-9-7 9-7v14z"/>
        <path d="M22 19l-9-7 9-7v14z"/>
      </svg>
    `;
    skipBackwardButton.title = 'Skip Backward 10s';

    skipBackwardButton.onclick = () => {
      const currentTime = playerRef.current.currentTime();
      playerRef.current.currentTime(Math.max(0, currentTime - 10));
    };

    // Add skip forward button
    const skipForwardButton = document.createElement('button');
    skipForwardButton.className = 'vjs-skip-forward vjs-control vjs-button';
    skipForwardButton.innerHTML = `
      <span class="vjs-icon-placeholder" aria-hidden="true"></span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 5l9 7-9 7V5z"/>
        <path d="M2 5l9 7-9 7V5z"/>
      </svg>
    `;
    skipForwardButton.title = 'Skip Forward 10s';

    skipForwardButton.onclick = () => {
      const currentTime = playerRef.current.currentTime();
      const duration = playerRef.current.duration();
      playerRef.current.currentTime(Math.min(duration, currentTime + 10));
    };

    // Add theater mode button
    const theaterButton = document.createElement('button');
    theaterButton.className = 'vjs-theater-mode vjs-control vjs-button';
    theaterButton.innerHTML = `
      <span class="vjs-icon-placeholder" aria-hidden="true"></span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/>
        <path d="M7 7h.01"/>
        <path d="M7 12h.01"/>
        <path d="M7 17h10"/>
        <path d="M17 7h.01"/>
        <path d="M17 12h.01"/>
      </svg>
    `;
    theaterButton.title = 'Theater Mode';

    theaterButton.onclick = () => {
      setIsTheaterMode(!isTheaterMode);
    };

    // Insert buttons in the control bar
    const playToggle = controlBar.el().querySelector('.vjs-play-control');
    if (playToggle) {
      playToggle.parentNode.insertBefore(skipBackwardButton, playToggle);
      playToggle.parentNode.insertBefore(skipForwardButton, playToggle.nextSibling);
    }

    // Add theater button before fullscreen
    const fullscreenToggle = controlBar.el().querySelector('.vjs-fullscreen-control');
    if (fullscreenToggle) {
      fullscreenToggle.parentNode.insertBefore(theaterButton, fullscreenToggle);
    }
  };

  const addKeyboardShortcuts = () => {
    if (!playerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (playerRef.current.paused()) {
            playerRef.current.play();
          } else {
            playerRef.current.pause();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          const currentTime = playerRef.current.currentTime();
          playerRef.current.currentTime(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          event.preventDefault();
          const currentTimeRight = playerRef.current.currentTime();
          const duration = playerRef.current.duration();
          playerRef.current.currentTime(Math.min(duration, currentTimeRight + 10));
          break;
        case 'ArrowUp':
          event.preventDefault();
          const newVolumeUp = Math.min(1, playerRef.current.volume() + 0.1);
          playerRef.current.volume(newVolumeUp);
          break;
        case 'ArrowDown':
          event.preventDefault();
          const newVolumeDown = Math.max(0, playerRef.current.volume() - 0.1);
          playerRef.current.volume(newVolumeDown);
          break;
        case 'KeyM':
          event.preventDefault();
          playerRef.current.muted(!playerRef.current.muted());
          break;
        case 'KeyF':
          event.preventDefault();
          if (playerRef.current.isFullscreen()) {
            playerRef.current.exitFullscreen();
          } else {
            playerRef.current.requestFullscreen();
          }
          break;
        case 'KeyT':
          event.preventDefault();
          setIsTheaterMode(!isTheaterMode);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    playerRef.current.on('dispose', () => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  };

  const addVolumeControls = () => {
    if (!playerRef.current) return;

    const controlBar = playerRef.current.getChild('controlBar');
    const volumePanel = controlBar.el().querySelector('.vjs-volume-panel');

    if (volumePanel) {
      // Add picture-in-picture button
      const pipButton = document.createElement('button');
      pipButton.className = 'vjs-picture-in-picture vjs-control vjs-button';
      pipButton.innerHTML = `
        <span class="vjs-icon-placeholder" aria-hidden="true"></span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2z"/>
          <path d="M9 9h6v6H9z"/>
        </svg>
      `;
      pipButton.title = 'Picture in Picture';

      pipButton.onclick = async () => {
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          } else if (playerRef.current.el().requestPictureInPicture) {
            await playerRef.current.el().requestPictureInPicture();
          }
        } catch (error) {
          console.error('Picture-in-picture failed:', error);
        }
      };

      // Insert PiP button after volume controls
      volumePanel.parentNode.insertBefore(pipButton, volumePanel.nextSibling);
    }
  };

  const saveProgress = async (time: number) => {
    // if (!episodeId && !videoId) return; // Don't save if neither exists

    // try {
    //   const duration = playerRef.current?.duration();
    //   if (!duration || duration === 0) return; // Don't save if duration is not available

    //   // Calculate progress as percentage (0-100)
    //   const progressPercentage = (time / duration) * 100;

    //   const endpoint = episodeId
    //     ? `/api/progress/${episodeId}`
    //     : `/api/progress/movie/${videoId}`;

    //   await fetch(endpoint, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ progress: progressPercentage }),
    //   });
    // } catch (err) {
    //   console.error('Failed to save progress', err);
    // }
  };

  const toggleMute = () => {
    if (playerRef.current) {
      playerRef.current.muted(!playerRef.current.muted());
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (playerRef.current) {
      playerRef.current.volume(newVolume);
      if (newVolume > 0 && playerRef.current.muted()) {
        playerRef.current.muted(false);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!mounted || !progressLoaded) {
    return <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className={`w-full h-full relative bg-black rounded-xl overflow-hidden ${isTheaterMode ? 'theater-mode' : ''}`}>
      <video ref={videoRef} className="video-js rounded-xl" />

      {/* Video Info Overlay */}
      <div className="absolute top-6 left-6 flex gap-4 z-20">
        <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full" />
            {formatTime(videoInfo.currentTime)} / {formatTime(videoInfo.duration)}
          </div>
        </div>
      </div>

      {/* Custom overlay for additional controls */}
      <div className="absolute top-6 right-6 flex gap-3 z-20">
        {/* Playback rate indicator */}
        <div className="bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-xl text-sm font-semibold border border-white/10 shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {playbackRate}x
          </div>
        </div>

        {/* Volume Control */}
        <div className="relative group">
          <button
            onClick={toggleMute}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
            className="bg-black/80 backdrop-blur-md hover:bg-black/90 text-white p-3 rounded-xl transition-all duration-300 border border-white/10 shadow-lg hover:border-primary/50"
          >
            {isMuted || volume === 0 ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : volume < 0.5 ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M15.54 8.46a5 5 0 010 7.07"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M15.54 8.46a5 5 0 010 7.07"/>
                <path d="M19.07 4.93a10 10 0 010 14.14"/>
              </svg>
            )}
          </button>

          {/* Volume Slider */}
          {showVolumeSlider && (
            <div
              className="absolute bottom-full right-0 mb-3 bg-black/90 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-white/10"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-32 h-2 bg-surface-lighter rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(isMuted ? 0 : volume) * 100}%, var(--surface-lighter) ${(isMuted ? 0 : volume) * 100}%, var(--surface-lighter) 100%)`
                }}
              />
              <div className="text-white text-xs text-center mt-2 font-medium">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="absolute bottom-24 left-6 bg-black/80 backdrop-blur-md text-white p-4 rounded-xl text-xs opacity-0 hover:opacity-100 transition-opacity duration-300 z-20 border border-white/10 shadow-lg">
        <div className="font-bold mb-3 text-primary">🎮 Keyboard Shortcuts:</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex justify-between">
            <span className="text-text-secondary">Play/Pause:</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">Space</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Skip ±10s:</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">← →</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Volume ±:</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">↑ ↓</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Mute:</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">M</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Fullscreen:</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">F</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Theater:</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">T</kbd>
          </div>
        </div>
      </div>

      <style jsx>{`
        .theater-mode .video-js {
          max-height: 85vh;
          border-radius: 12px;
        }

        .vjs-skip-backward,
        .vjs-skip-forward,
        .vjs-theater-mode,
        .vjs-picture-in-picture {
          background: rgba(0, 0, 0, 0.8) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          color: #fff !important;
          cursor: pointer;
          padding: 8px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }

        .vjs-skip-backward:hover,
        .vjs-skip-forward:hover,
        .vjs-theater-mode:hover,
        .vjs-picture-in-picture:hover {
          background: rgba(0, 212, 255, 0.1) !important;
          border-color: var(--primary) !important;
          color: var(--primary) !important;
          transform: scale(1.02) !important;
        }

        .vjs-skip-backward svg,
        .vjs-skip-forward svg,
        .vjs-theater-mode svg,
        .vjs-picture-in-picture svg {
          width: 20px !important;
          height: 20px !important;
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 212, 255, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0, 212, 255, 0.2);
        }

        .vjs-control-bar {
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%) !important;
          backdrop-filter: blur(20px) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 0 0 12px 12px !important;
        }

        .vjs-big-play-button {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%) !important;
          border-radius: 50% !important;
          box-shadow: 0 4px 15px rgba(0, 212, 255, 0.2) !important;
          border: 2px solid rgba(255, 255, 255, 0.2) !important;
          transition: all 0.3s ease !important;
        }

        .vjs-big-play-button:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 6px 20px rgba(0, 212, 255, 0.3) !important;
        }
      `}</style>
    </div>
  );
}
