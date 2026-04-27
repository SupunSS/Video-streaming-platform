'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  FiChevronLeft,
  FiChevronRight,
  FiMaximize,
  FiMinimize,
  FiPause,
  FiPlay,
  FiSettings,
  FiVolume2,
  FiVolumeX,
} from 'react-icons/fi';
import { MdClosedCaption, MdClosedCaptionDisabled, MdPictureInPictureAlt } from 'react-icons/md';

type CaptionTrack = {
  src: string;
  label: string;
  srcLang: string;
  default?: boolean;
};

type QualitySource = {
  label: string;
  src: string;
};

type QualityOption = {
  label: string;
  value: number | string;
};

type HlsQualityState = {
  src: string;
  options: QualityOption[];
};

type SelectedQualityState = {
  src: string;
  value: number | string;
};

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  captions?: CaptionTrack[];
  sources?: QualitySource[];
}

const CONTROL_HIDE_DELAY = 2200;

const formatTime = (time: number): string => {
  if (!Number.isFinite(time) || time < 0) return '0:00';

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getBufferedEnd = (video: HTMLVideoElement | null): number => {
  if (!video || video.buffered.length === 0) return 0;

  try {
    return video.buffered.end(video.buffered.length - 1);
  } catch {
    return 0;
  }
};

const toPercent = (value: number, total: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
};

const sliderStyle = (percent: number) => ({
  background: `linear-gradient(to right, rgb(245 158 11) 0%, rgb(245 158 11) ${percent}%, rgba(255,255,255,0.18) ${percent}%, rgba(255,255,255,0.18) 100%)`,
});

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  captions = [],
  sources = [],
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);

  const [volume, setVolume] = useState(1);
  const [lastVolume, setLastVolume] = useState(1);

  const [playbackRate, setPlaybackRate] = useState(1);

  const [hlsQualityState, setHlsQualityState] = useState<HlsQualityState>({
    src: '',
    options: [],
  });

  const [selectedQualityState, setSelectedQualityState] = useState<SelectedQualityState>({
    src: '',
    value: 'auto',
  });

  const [hasCaptions, setHasCaptions] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);

  const playbackRates = useMemo(() => [0.5, 0.75, 1, 1.25, 1.5, 2], []);
  const isHlsSource = useMemo(() => src.toLowerCase().includes('.m3u8'), [src]);

  const fileQualityOptions = useMemo<QualityOption[]>(() => {
    if (isHlsSource || sources.length === 0) return [];
    return sources.map((item) => ({ label: item.label, value: item.src }));
  }, [isHlsSource, sources]);

  const qualityOptions = useMemo<QualityOption[]>(() => {
    if (isHlsSource) {
      return hlsQualityState.src === src ? hlsQualityState.options : [];
    }
    return fileQualityOptions;
  }, [fileQualityOptions, hlsQualityState, isHlsSource, src]);

  const effectiveSelectedQuality = useMemo<number | string>(() => {
    if (isHlsSource) {
      return selectedQualityState.src === src ? selectedQualityState.value : 'auto';
    }

    if (sources.length > 0) {
      return src;
    }

    return 'auto';
  }, [isHlsSource, selectedQualityState, sources.length, src]);

  const playedPercent = toPercent(currentTime, duration);
  const bufferedPercent = toPercent(buffered, duration);
  const volumePercent = Math.min(100, Math.max(0, volume * 100));

  const clearHideTimer = useCallback(() => {
    if (controlsTimeoutRef.current !== null) {
      window.clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearHideTimer();
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettings(false);
      }
    }, CONTROL_HIDE_DELAY);
  }, [clearHideTimer, isPlaying]);

  const showControlsNow = useCallback(() => {
    setShowControls(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const destroyHls = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
  }, []);

  const refreshCaptionAvailability = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const tracks = Array.from(video.textTracks ?? []);
    const available = tracks.length > 0;

    setHasCaptions(available);
    setCaptionsEnabled(available && tracks.some((track) => track.mode === 'showing'));
  }, []);

  const applyCaptionState = useCallback((enabled: boolean) => {
    const video = videoRef.current;
    if (!video) return;

    const tracks = Array.from(video.textTracks ?? []);
    tracks.forEach((track, index) => {
      track.mode = enabled && index === 0 ? 'showing' : 'disabled';
    });

    setCaptionsEnabled(enabled && tracks.length > 0);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    destroyHls();

    if (isHlsSource) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const levels = data.levels ?? [];
          const unique = Array.from(
            new Map(
              levels
                .filter((level) => level.height)
                .map((level, index) => [level.height, { label: `${level.height}p`, value: index }]),
            ).values(),
          ).sort((a, b) => Number(b.label.replace('p', '')) - Number(a.label.replace('p', '')));

          setHlsQualityState({
            src,
            options: unique.length > 0 ? [{ label: 'Auto', value: 'auto' }, ...unique] : [],
          });

          setSelectedQualityState({
            src,
            value: 'auto',
          });
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          setSelectedQualityState({
            src,
            value: data.level >= 0 ? data.level : 'auto',
          });
        });
      } else {
        video.src = src;
      }
    } else {
      video.src = src;
    }

    return () => {
      destroyHls();
    };
  }, [src, isHlsSource, destroyHls]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setCurrentTime(video.currentTime || 0);
      setBuffered(getBufferedEnd(video));
      setIsReady(true);
      refreshCaptionAvailability();
      showControlsNow();
    };

    const onLoadedData = () => {
      setBuffered(getBufferedEnd(video));
      setIsReady(true);
    };

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
    };

    const onProgress = () => {
      setBuffered(getBufferedEnd(video));
    };

    const onDurationChange = () => {
      setDuration(video.duration || 0);
    };

    const onPlay = () => {
      setIsPlaying(true);
      scheduleHideControls();
    };

    const onPause = () => {
      setIsPlaying(false);
      setShowControls(true);
      clearHideTimer();
    };

    const onEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
      clearHideTimer();
    };

    const onVolumeChange = () => {
      const muted = video.muted || video.volume === 0;
      setIsMuted(muted);
      setVolume(muted ? 0 : video.volume);
    };

    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('progress', onProgress);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('enterpictureinpicture', onEnterPiP as EventListener);
    video.addEventListener('leavepictureinpicture', onLeavePiP as EventListener);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('enterpictureinpicture', onEnterPiP as EventListener);
      video.removeEventListener('leavepictureinpicture', onLeavePiP as EventListener);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [clearHideTimer, refreshCaptionAvailability, scheduleHideControls, showControlsNow]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    return () => clearHideTimer();
  }, [clearHideTimer]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (error) {
      console.error('Failed to toggle play state:', error);
    }
  };

  const skipBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const total = duration || video.duration || 0;
    const nextTime = Math.min(Math.max(0, video.currentTime + seconds), total);

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    showControlsNow();
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const nextTime = Number(event.target.value);
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    showControlsNow();
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const nextVolume = Number(event.target.value);
    video.muted = nextVolume === 0;
    video.volume = nextVolume;

    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);

    if (nextVolume > 0) {
      setLastVolume(nextVolume);
    }

    showControlsNow();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.muted || video.volume === 0) {
      const restoredVolume = lastVolume > 0 ? lastVolume : 1;
      video.muted = false;
      video.volume = restoredVolume;
      setVolume(restoredVolume);
      setIsMuted(false);
      return;
    }

    setLastVolume(video.volume || 1);
    video.muted = true;
    setVolume(0);
    setIsMuted(true);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Failed to toggle picture-in-picture:', error);
    }
  };

  const handlePlaybackRateSelect = (rate: number) => {
    setPlaybackRate(rate);
    setShowSettings(false);
    showControlsNow();
  };

  const handleQualitySelect = async (value: number | string) => {
    const video = videoRef.current;
    if (!video) return;

    const wasPlaying = !video.paused;
    const playbackPosition = video.currentTime;

    if (isHlsSource && hlsRef.current) {
      hlsRef.current.currentLevel = value === 'auto' ? -1 : Number(value);
      setSelectedQualityState({
        src,
        value,
      });
      setShowSettings(false);
      showControlsNow();
      return;
    }

    if (typeof value === 'string' && value) {
      video.src = value;
      video.currentTime = playbackPosition;
      setShowSettings(false);

      if (wasPlaying) {
        try {
          await video.play();
        } catch (error) {
          console.error('Failed to resume after quality change:', error);
        }
      }

      showControlsNow();
    }
  };

  const toggleCaptions = () => {
    if (!hasCaptions) return;
    applyCaptionState(!captionsEnabled);
    showControlsNow();
  };

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-[28px] bg-black"
      onMouseMove={showControlsNow}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSettings(false);
        }
      }}
      onTouchStart={showControlsNow}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="h-full w-full bg-black object-cover"
        playsInline
        preload="metadata"
        onClick={togglePlay}
      >
        {captions.map((track) => (
          <track
            key={`${track.src}-${track.srcLang}`}
            kind="subtitles"
            src={track.src}
            srcLang={track.srcLang}
            label={track.label}
            default={track.default}
          />
        ))}
      </video>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />

      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:scale-105 hover:bg-black/70"
          aria-label="Play video"
        >
          <FiPlay className="ml-1 text-3xl" />
        </button>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 z-30 transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="px-4 pb-4 pt-16 sm:px-5 sm:pb-5">
          <div className="mb-3">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/25"
                style={{ width: `${bufferedPercent}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-amber-400"
                style={{ width: `${playedPercent}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(245,158,11,0.25)] [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-amber-400"
                aria-label="Seek"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="rounded-full p-2 text-white/90 transition hover:bg-white/10 hover:text-white"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <FiPause className="text-xl" /> : <FiPlay className="text-xl" />}
              </button>

              <button
                type="button"
                onClick={() => skipBy(-10)}
                className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Rewind 10 seconds"
              >
                <FiChevronLeft className="text-xl" />
              </button>

              <button
                type="button"
                onClick={() => skipBy(10)}
                className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Forward 10 seconds"
              >
                <FiChevronRight className="text-xl" />
              </button>

              <div className="ml-1 flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="rounded-full p-2 text-white/90 transition hover:bg-white/10 hover:text-white"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <FiVolumeX className="text-xl" /> : <FiVolume2 className="text-xl" />}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={handleVolumeChange}
                  style={sliderStyle(volumePercent)}
                  className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-white/15 sm:w-28 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-amber-400"
                  aria-label="Volume"
                />
              </div>

              <div className="ml-2 whitespace-nowrap text-sm font-medium text-white/85">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 sm:gap-2">
              <button
                type="button"
                onClick={toggleCaptions}
                disabled={!hasCaptions}
                className={`rounded-full p-2 transition ${
                  hasCaptions
                    ? 'text-white/90 hover:bg-white/10 hover:text-white'
                    : 'cursor-not-allowed text-white/30'
                }`}
                aria-label="Toggle captions"
                title={hasCaptions ? 'Captions' : 'No captions available'}
              >
                {captionsEnabled ? (
                  <MdClosedCaption className="text-[22px]" />
                ) : (
                  <MdClosedCaptionDisabled className="text-[22px]" />
                )}
              </button>

              <button
                type="button"
                onClick={togglePiP}
                className="rounded-full p-2 text-white/85 transition hover:bg-white/10 hover:text-white"
                aria-label="Picture in picture"
                title={isPiP ? 'Exit picture in picture' : 'Picture in picture'}
              >
                <MdPictureInPictureAlt className="text-[22px]" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSettings((value) => !value)}
                  className="rounded-full p-2 text-white/90 transition hover:bg-white/10 hover:text-white"
                  aria-label="Player settings"
                >
                  <FiSettings className="text-xl" />
                </button>

                {showSettings && (
                  <div className="absolute bottom-12 right-0 w-56 overflow-hidden rounded-2xl border border-white/10 bg-black/90 p-2 shadow-2xl backdrop-blur-xl">
                    <div className="mb-2 px-2 pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                      Playback speed
                    </div>

                    <div className="mb-3 space-y-1">
                      {playbackRates.map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handlePlaybackRateSelect(rate)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                            playbackRate === rate
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{rate}x</span>
                          {playbackRate === rate ? <span>✓</span> : null}
                        </button>
                      ))}
                    </div>

                    <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                      Quality
                    </div>

                    <div className="space-y-1">
                      {qualityOptions.length > 0 ? (
                        qualityOptions.map((option) => {
                          const active = effectiveSelectedQuality === option.value;

                          return (
                            <button
                              key={`${option.label}-${String(option.value)}`}
                              type="button"
                              onClick={() => handleQualitySelect(option.value)}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                                active
                                  ? 'bg-amber-500/15 text-amber-300'
                                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span>{option.label}</span>
                              {active ? <span>✓</span> : null}
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-xl px-3 py-2 text-sm text-white/45">
                          Quality options unavailable
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="rounded-full p-2 text-white/90 transition hover:bg-white/10 hover:text-white"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <FiMinimize className="text-xl" /> : <FiMaximize className="text-xl" />}
              </button>
            </div>
          </div>

          {(title || !isReady) && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                {title ? <p className="truncate text-sm font-medium text-white/85">{title}</p> : null}
                {!isReady ? <p className="text-xs text-white/45">Loading video metadata...</p> : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;