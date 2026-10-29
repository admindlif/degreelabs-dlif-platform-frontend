"use client";

import * as React from "react";
import {
  AlertCircle,
  ExternalLink,
  Info,
  Maximize,
  Minimize,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime, isPlaybackUrlExpiring } from "./utils";
export { formatTime };

export interface RecordingPlayerProps {
  playbackUrl: string | null;
  status: string;
  durationSeconds?: number | null;
  expiresAt?: string | null;
  isLoading: boolean;
  error?: string | null;
  onRefreshUrl?: () => Promise<string | null>;
  onTimeUpdate?: (currentTime: number) => void;
  seekTargetTime?: number | null;
  legacyUrl?: string | null;
  title?: string;
  isSeekable?: boolean;
}

type IOSVideoElement = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

export function RecordingPlayer({
  playbackUrl,
  status,
  durationSeconds,
  expiresAt,
  isLoading,
  error,
  onRefreshUrl,
  onTimeUpdate,
  seekTargetTime,
  legacyUrl,
  title,
  isSeekable = false,
}: RecordingPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const activeUrlRef = React.useRef<string | null>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [mediaDuration, setMediaDuration] = React.useState<number | null>(null);
  const [bufferedEnd, setBufferedEnd] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [playbackError, setPlaybackError] = React.useState<string | null>(null);
  const [showControls, setShowControls] = React.useState(true);
  const [seekNotice, setSeekNotice] = React.useState<string | null>(null);
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [scrubValue, setScrubValue] = React.useState(0);
  const [isIOSDevice, setIsIOSDevice] = React.useState(false);
  const [isIPhone, setIsIPhone] = React.useState(false);

  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const seekNoticeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = React.useRef(false);
  const autoRefreshInitiatedRef = React.useRef(false);
  const errorRefreshCountRef = React.useRef(0);

  React.useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      const userAgent = navigator.userAgent;
      const iPadDesktopMode =
        navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

      setIsIOSDevice(
        /iPhone|iPad|iPod/i.test(userAgent) || iPadDesktopMode
      );
      setIsIPhone(/iPhone|iPod/i.test(userAgent));
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  // Authoritative total duration: backend durationSeconds is primary because
  // the tl;dv fMP4 stream does not contain mehd header and reports 0 or chunk duration in Chrome.
  const totalDuration = React.useMemo(() => {
    if (typeof durationSeconds === "number" && Number.isFinite(durationSeconds) && durationSeconds > 0) {
      return durationSeconds;
    }
    if (typeof mediaDuration === "number" && Number.isFinite(mediaDuration) && mediaDuration > 0) {
      return mediaDuration;
    }
    return 0;
  }, [durationSeconds, mediaDuration]);

  // Displayed current time (uses scrubValue while dragging scrubber)
  const displayedTime = isScrubbing ? scrubValue : currentTime;

  // Show a temporary non-blocking notice (e.g. when seeking beyond buffer)
  const showNotice = React.useCallback((message: string) => {
    setSeekNotice(message);
    if (seekNoticeTimeoutRef.current) clearTimeout(seekNoticeTimeoutRef.current);
    seekNoticeTimeoutRef.current = setTimeout(() => {
      setSeekNotice(null);
    }, 4500);
  }, []);

  // Safely determine current seekable / buffered boundary of the video element
  const getSeekableEnd = React.useCallback((video: HTMLVideoElement): number => {
    try {
      if (video.seekable && video.seekable.length > 0) {
        const end = video.seekable.end(video.seekable.length - 1);
        if (Number.isFinite(end) && end > 0) return end;
      }
      if (video.buffered && video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        if (Number.isFinite(end) && end > 0) return end;
      }
    } catch {
      // ignore
    }
    return video.currentTime || 0;
  }, []);

  // Update buffered progress
  const updateBufferedEnd = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.buffered && video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        if (Number.isFinite(end) && end >= 0) {
          setBufferedEnd(end);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Seek handler that respects media buffer boundaries and prevents restarts
  const executeSeek = React.useCallback((targetSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const clampedTarget = Math.max(0, targetSeconds);

    // Verified seekable source (native HTML5 video seeking)
    if (isSeekable) {
      try {
        video.currentTime = clampedTarget;
        setCurrentTime(clampedTarget);
        onTimeUpdate?.(clampedTarget);
        setSeekNotice(null);
      } catch (err) {
        console.warn("Playback seek error:", err);
      }
      return;
    }

    const maxSeekable = getSeekableEnd(video);

    // If target is within buffered/seekable window (with small tolerance)
    if (clampedTarget <= maxSeekable + 1) {
      try {
        video.currentTime = clampedTarget;
        setCurrentTime(clampedTarget);
        onTimeUpdate?.(clampedTarget);
        setSeekNotice(null);
      } catch (err) {
        console.warn("Playback seek error:", err);
      }
    } else {
      // Target is beyond currently buffered stream.
      // Do NOT set video.currentTime to unbuffered space, as Chrome resets progressive HTTP 200 streams to 0!
      const currentPos = video.currentTime;
      showNotice(
        `Seeking to ${formatTime(clampedTarget)} is currently buffering (downloaded to ${formatTime(
          maxSeekable
        )}). Video continues from ${formatTime(currentPos)}.`
      );
    }
  }, [getSeekableEnd, isSeekable, onTimeUpdate, showNotice]);

  // Sync seekTargetTime from parent (e.g. transcript timestamp clicks)
  React.useEffect(() => {
    if (seekTargetTime !== null && seekTargetTime !== undefined && videoRef.current) {
      executeSeek(seekTargetTime);
      videoRef.current.play().catch(() => { });
      setIsPlaying(true);
    }
  }, [seekTargetTime, executeSeek]);

  // Shared refresh mechanism used by initial load, manual button, and recovery
  const performRefresh = React.useCallback(async () => {
    if (!onRefreshUrl || isRefreshingRef.current) return null;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setPlaybackError(null);
    try {
      const freshUrl = await onRefreshUrl();
      if (freshUrl && videoRef.current) {
        const isSameStream =
          activeUrlRef.current !== null &&
          activeUrlRef.current.split("?")[0] === freshUrl.split("?")[0];
        const prevTime = isSameStream ? videoRef.current.currentTime : 0;
        activeUrlRef.current = freshUrl;
        videoRef.current.src = freshUrl;
        videoRef.current.load();
        if (prevTime > 0) {
          const handleLoaded = () => {
            if (!videoRef.current) return;
            videoRef.current.removeEventListener("loadedmetadata", handleLoaded);
            try {
              videoRef.current.currentTime = prevTime;
            } catch {
              // ignore
            }
          };
          videoRef.current.addEventListener("loadedmetadata", handleLoaded);
        }
      }
      return freshUrl;
    } catch (err: unknown) {
      setPlaybackError(
        err instanceof Error ? err.message : "Failed to refresh link"
      );
      return null;
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [onRefreshUrl]);

  // Automatically refresh and load the playback stream on mount / when ready
  React.useEffect(() => {
    if (autoRefreshInitiatedRef.current) return;
    if (!onRefreshUrl || isLoading) return;

    autoRefreshInitiatedRef.current = true;
    void performRefresh();
  }, [onRefreshUrl, isLoading, performRefresh]);

  // Prevent video source reloading when component rerenders with same URL
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl || isRefreshingRef.current) return;

    if (activeUrlRef.current !== playbackUrl) {
      const isSameStream =
        activeUrlRef.current !== null &&
        activeUrlRef.current.split("?")[0] === playbackUrl.split("?")[0];
      const prevTime = isSameStream ? video.currentTime : 0;
      const wasPlaying = isSameStream ? !video.paused : false;
      activeUrlRef.current = playbackUrl;
      video.src = playbackUrl;
      video.load();

      // Restore position if refreshing active stream
      if (prevTime > 0) {
        const handleLoaded = () => {
          video.removeEventListener("loadedmetadata", handleLoaded);
          try {
            const maxSeek = getSeekableEnd(video);
            if (prevTime <= maxSeek) {
              video.currentTime = prevTime;
            }
            if (wasPlaying) {
              video.play().catch(() => { });
            }
          } catch {
            // ignore
          }
        };
        video.addEventListener("loadedmetadata", handleLoaded);
      }
    }
  }, [playbackUrl, getSeekableEnd]);

  // Handle URL expiration check
  React.useEffect(() => {
    if (expiresAt && isPlaybackUrlExpiring(expiresAt) && onRefreshUrl) {
      void performRefresh();
    }
  }, [expiresAt, onRefreshUrl, performRefresh]);

  // Mouse move in container to show controls temporarily
  const handleMouseMove = React.useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 2800);
  }, [isPlaying]);

  React.useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (seekNoticeTimeoutRef.current) clearTimeout(seekNoticeTimeoutRef.current);
    };
  }, []);

  const togglePlay = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      setPlaybackError(null);
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch((err: unknown) => {
          const name = (err as { name?: string })?.name;
          const message = (err as { message?: string })?.message || "";
          if (
            name === "AbortError" ||
            message.toLowerCase().includes("interrupted")
          ) {
            // Intentional pause or source change interrupted the play request
            return;
          }
          setPlaybackError(
            "Unable to play video: " + (message || "Unknown error")
          );
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Scrubber drag start
  const handleScrubStart = () => {
    setIsScrubbing(true);
    setScrubValue(currentTime);
  };

  // Scrubber dragging
  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScrubValue(parseFloat(e.target.value));
  };

  // Scrubber drag release
  const handleScrubEnd = () => {
    setIsScrubbing(false);
    executeSeek(scrubValue);
  };

  // Skip forward or backward by delta seconds
  const skipSeconds = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;

    if (isSeekable) {
      const maxTime = totalDuration > 0 ? totalDuration : (Number.isFinite(video.duration) && video.duration > 0 ? video.duration : Infinity);
      const newTime = Math.max(0, Math.min(maxTime, video.currentTime + delta));
      executeSeek(newTime);
      return;
    }

    if (delta < 0) {
      // Backward skip is always safe within already downloaded buffer
      const newTime = Math.max(0, video.currentTime + delta);
      executeSeek(newTime);
    } else {
      // Forward skip: check buffer
      const maxSeekable = getSeekableEnd(video);
      const targetTime = video.currentTime + delta;
      if (targetTime <= maxSeekable + 0.5) {
        executeSeek(targetTime);
      } else if (maxSeekable > video.currentTime + 1) {
        // Clamp to buffer edge
        executeSeek(maxSeekable);
        showNotice(`Skipped to buffered limit (${formatTime(maxSeekable)}). Next section is buffering.`);
      } else {
        showNotice(`Buffering stream (downloaded to ${formatTime(maxSeekable)}). Skip forward will be available once buffered.`);
      }
    }
  };

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const synchronizeVolume = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };

    synchronizeVolume();
    video.addEventListener("volumechange", synchronizeVolume);

    return () => {
      video.removeEventListener("volumechange", synchronizeVolume);
    };
  }, [playbackUrl]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleFullscreen = async () => {
    const video = videoRef.current as IOSVideoElement | null;
    const container = containerRef.current;

    if (!video || !container) return;

    if (isIPhone && typeof video.webkitEnterFullscreen === "function") {
      try {
        if (
          video.webkitDisplayingFullscreen &&
          typeof video.webkitExitFullscreen === "function"
        ) {
          video.webkitExitFullscreen();
        } else {
          video.webkitEnterFullscreen();
        }
      } catch {
        setPlaybackError("Fullscreen is unavailable on this device.");
      }

      return;
    }

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setPlaybackError("Fullscreen is unavailable on this device.");
    }
  };

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleIOSFullscreenStart = () => setIsFullscreen(true);
    const handleIOSFullscreenEnd = () => setIsFullscreen(false);

    video.addEventListener(
      "webkitbeginfullscreen",
      handleIOSFullscreenStart
    );
    video.addEventListener(
      "webkitendfullscreen",
      handleIOSFullscreenEnd
    );

    return () => {
      video.removeEventListener(
        "webkitbeginfullscreen",
        handleIOSFullscreenStart
      );
      video.removeEventListener(
        "webkitendfullscreen",
        handleIOSFullscreenEnd
      );
    };
  }, []);

  const handleVideoError = async () => {
    const video = videoRef.current;
    if (video?.error?.code === 1) {
      // MEDIA_ERR_ABORTED: fetch was aborted by user or source change
      return;
    }
    if (onRefreshUrl && !isRefreshingRef.current && errorRefreshCountRef.current < 1) {
      errorRefreshCountRef.current += 1;
      const freshUrl = await performRefresh();
      if (freshUrl) {
        return;
      }
    }
    setPlaybackError("Failed to load playback stream. The video link may have expired or is not playable.");
  };

  const handleManualRefresh = async () => {
    errorRefreshCountRef.current = 0;
    await performRefresh();
  };

  // State 1: Global Loading
  if (isLoading) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-6 text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-[var(--color-brand-orange)]" />
        <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">
          Loading tl;dv recording...
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Retrieving secure in-portal playback stream
        </p>
      </div>
    );
  }

  // State 2: Processing by tl;dv
  if (status === "processing") {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/60 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
        <Badge variant="gold" size="md" className="mt-4">
          tl;dv Processing In Progress
        </Badge>
        <h3 className="mt-2 text-base font-bold text-amber-950">
          Recording & AI Transcript Are Being Prepared
        </h3>
        <p className="mt-1.5 max-w-md text-xs text-amber-800">
          tl;dv is currently processing the meeting video and generating the AI transcript. This usually completes shortly after the live session ends.
        </p>
        {onRefreshUrl && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="mt-4 bg-white hover:bg-amber-100"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Checking Status..." : "Check Status"}
          </Button>
        )}
      </div>
    );
  }

  // State 3: Fatal Error / No URL available
  if (error || (!playbackUrl && status !== "ready")) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-[var(--color-text-muted)]">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-[var(--color-text-primary)]">
          {error || "Recording Not Yet Available"}
        </h3>
        <p className="mt-1 max-w-md text-xs text-[var(--color-text-muted)]">
          {error
            ? "Unable to load the session recording stream. Please try again later."
            : "The session recording has not been uploaded or processed yet."}
        </p>

        {legacyUrl && (
          <div className="mt-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-3 text-xs">
            <span className="font-semibold text-[var(--color-text-primary)]">Legacy Link Available: </span>
            <a
              href={legacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-[var(--color-brand-blue)] hover:underline"
            >
              Open External Recording
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    );
  }

  // Calculate timeline progress percentages
  const maxTimeline = totalDuration > 0 ? totalDuration : Math.max(100, currentTime);
  const playedPercent = Math.min(100, Math.max(0, (displayedTime / maxTimeline) * 100));
  const bufferedPercent = Math.min(100, Math.max(0, (bufferedEnd / maxTimeline) * 100));

  // State 4: Ready with playbackUrl
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-md focus:outline-hidden select-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "k") {
          e.preventDefault();
          togglePlay();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          skipSeconds(-10);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          skipSeconds(10);
        } else if (e.key === "m") {
          e.preventDefault();
          toggleMute();
        } else if (e.key === "f") {
          e.preventDefault();
          toggleFullscreen();
        }
      }}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        crossOrigin={isSeekable ? "anonymous" : undefined}
        className="h-full w-full object-contain cursor-pointer"
        playsInline
        preload="auto"
        onClick={togglePlay}
        onTimeUpdate={() => {
          if (videoRef.current && !isScrubbing) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);
            onTimeUpdate?.(time);
            updateBufferedEnd();
          }
        }}
        onProgress={updateBufferedEnd}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (!video) return;
          const d = video.duration;
          // Only adopt media duration if valid and finite
          if (Number.isFinite(d) && d > 0 && (!durationSeconds || d >= durationSeconds * 0.95)) {
            setMediaDuration(d);
          }
          updateBufferedEnd();
        }}
        onDurationChange={() => {
          const video = videoRef.current;
          if (!video) return;
          const d = video.duration;
          if (Number.isFinite(d) && d > 0 && (!durationSeconds || d >= durationSeconds * 0.95)) {
            setMediaDuration(d);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={handleVideoError}
      />

      {/* Floating Notice / Seeking Limitation Banner */}
      {seekNotice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-xl bg-neutral-900/90 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-white shadow-lg border border-neutral-700 animate-in fade-in zoom-in-95 duration-200">
          <Info className="h-4 w-4 text-[var(--color-brand-orange)] shrink-0" />
          <span>{seekNotice}</span>
        </div>
      )}

      {/* Playback Error Overlay */}
      {playbackError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 p-6 text-center text-white">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <h4 className="mt-3 text-sm font-bold text-white">Stream Playback Error</h4>
          <p className="mt-1 max-w-sm text-xs text-neutral-300">{playbackError}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {onRefreshUrl && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing Link..." : "Refresh Stream Link"}
              </Button>
            )}
            {legacyUrl && (
              <a
                href={legacyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-neutral-600 bg-neutral-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700"
              >
                Open External Video
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Refreshing Stream Loading Overlay */}
      {isRefreshing && !playbackError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs p-6 text-center text-white">
          <RefreshCw className="h-8 w-8 animate-spin text-[var(--color-brand-orange)]" />
          <p className="mt-3 text-sm font-semibold text-white">
            Loading playback stream...
          </p>
          <p className="mt-1 text-xs text-neutral-300">
            Retrieving fresh video stream link
          </p>
        </div>
      )}

      {/* Center Big Play Button (when paused) */}
      {!isPlaying && !playbackError && !isRefreshing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play recording"
          className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-orange)]/90 text-white shadow-xl transition-transform hover:scale-110 active:scale-95 z-10"
        >
          <Play className="ml-1 h-8 w-8 fill-current" />
        </button>
      )}

      {/* Top Header Overlay with Title */}
      {title && (
        <div
          className={`absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-3 sm:p-4 transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
          <p className="truncate text-xs font-semibold text-white/90 drop-shadow-xs">
            {title}
          </p>
        </div>
      )}

      {/* Video Controls Bar */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 sm:p-4 transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Scrubber / Progress Bar with Buffered Timeline indicator */}
        <div className="relative mb-3 flex items-center group/scrubber cursor-pointer">
          {/* Base track */}
          <div className="relative h-1.5 w-full rounded-full bg-neutral-700/80 group-hover/scrubber:h-2.5 transition-all overflow-hidden">
            {/* Buffered progress fill */}
            <div
              className="absolute left-0 top-0 h-full bg-neutral-400/50 transition-all duration-300"
              style={{ width: `${bufferedPercent}%` }}
              title={`Buffered: ${formatTime(bufferedEnd)}`}
            />
            {/* Played progress fill */}
            <div
              className="absolute left-0 top-0 h-full bg-[var(--color-brand-orange)]"
              style={{ width: `${playedPercent}%` }}
            />
          </div>

          {/* Accessible slider input overlaid */}
          <input
            type="range"
            min={0}
            max={maxTimeline}
            step={0.1}
            value={displayedTime}
            onMouseDown={handleScrubStart}
            onTouchStart={() => setIsScrubbing(true)}
            onChange={handleScrubChange}
            onMouseUp={handleScrubEnd}
            onTouchEnd={handleScrubEnd}
            aria-label="Video scrubber"
            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Control Buttons & Timestamps */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-white text-xs">
          {/* Left Controls: Play/Pause, Skips, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skipSeconds(-10)}
              aria-label="Rewind 10 seconds"
              className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-white/10 cursor-pointer"
              title="Rewind 10s"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => skipSeconds(10)}
              aria-label="Fast forward 10 seconds"
              className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-white/10 cursor-pointer"
              title="Forward 10s"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>

            {/* Time readout: current / total */}
            <span className="font-mono text-[11px] sm:text-xs text-neutral-300 select-none">
              {formatTime(displayedTime)} / {formatTime(totalDuration)}
            </span>
          </div>

          {/* Right Controls: Volume, Speed, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="text-neutral-300 hover:text-white cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>

              {!isIOSDevice ? (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  aria-label="Volume slider"
                  className="w-14 sm:w-16 h-1 cursor-pointer appearance-none rounded-lg bg-neutral-600 accent-white"
                />
              ) : (
                <span className="text-[10px] text-neutral-300">
                  Device volume
                </span>
              )}
            </div>
            {/* Speed Selector */}
            <div className="relative">
              <select
                value={playbackRate}
                onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                aria-label="Playback speed"
                className="rounded-md bg-neutral-800/80 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-200 border border-neutral-700 outline-hidden hover:bg-neutral-700 cursor-pointer"
              >
                <option value={0.75}>0.75x</option>
                <option value={1}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2.0x</option>
              </select>
            </div>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-white/10 cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
