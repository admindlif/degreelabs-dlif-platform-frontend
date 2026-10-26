"use client";

import * as React from "react";
import {
  ExternalLink,
  Film,
  RefreshCw,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecordingPlayer, formatTime } from "./recording-player";
import { TranscriptViewer } from "./transcript-viewer";
import { getSessionRecording, getSessionTranscript } from "@/lib/api/discover";
import {
  SessionRecordingResponse,
  SessionTranscriptResponse,
} from "@/lib/api/types";

export interface SessionRecordingTabProps {
  sessionId: string;
  sessionTitle: string;
  legacyRecordingUrl?: string | null;
  legacyTranscriptUrl?: string | null;
}

export function SessionRecordingTab({
  sessionId,
  sessionTitle,
  legacyRecordingUrl,
  legacyTranscriptUrl,
}: SessionRecordingTabProps) {
  const [recording, setRecording] =
    React.useState<SessionRecordingResponse | null>(null);
  const [transcript, setTranscript] =
    React.useState<SessionTranscriptResponse | null>(null);

  const [loadingRecording, setLoadingRecording] = React.useState(true);
  const [loadingTranscript, setLoadingTranscript] = React.useState(true);

  const [recordingError, setRecordingError] = React.useState<string | null>(null);
  const [transcriptError, setTranscriptError] = React.useState<string | null>(null);

  const [currentTime, setCurrentTime] = React.useState(0);
  const [seekTargetTime, setSeekTargetTime] = React.useState<number | null>(null);

  // Recording playback flow uses direct playback_url returned by /recording
  const hasRecording = Boolean(recording?.has_recording);
  const isSeekable = hasRecording;
  const effectivePlaybackUrl = recording?.playback_url ?? null;

  // Fetch recording data
  const fetchRecording = React.useCallback(async () => {
    setLoadingRecording(true);
    setRecordingError(null);
    try {
      const data = await getSessionRecording(sessionId);
      setRecording(data);
      return data.playback_url;
    } catch (err: unknown) {
      // If 404 or backend unavailable, set graceful fallback
      const msg = err instanceof Error ? err.message : "Recording currently unavailable";
      setRecordingError(msg);
      return null;
    } finally {
      setLoadingRecording(false);
    }
  }, [sessionId]);
  // Auto-refresh polling: re-fetch recording every 30s while status is not ready.
  // Stops automatically once the recording becomes available so fellows see it
  // without a manual page reload after a new session is processed.
  React.useEffect(() => {
    const isReady = recording?.status === "ready" && recording?.has_recording;
    const isProcessingOrPending =
      !isReady &&
      !loadingRecording &&
      recording !== null &&
      recording.status !== "unavailable";

    if (!isProcessingOrPending) return;

    const intervalId = setInterval(async () => {
      try {
        const data = await getSessionRecording(sessionId);
        setRecording(data);
        if (data.status === "ready" && data.has_recording) {
          setRecordingError(null);
        }
      } catch {
        // Silent: do not overwrite existing data on transient errors
      }
    }, 30_000);

    return () => clearInterval(intervalId);
  }, [sessionId, recording, loadingRecording]);


  // Fetch transcript data
  const fetchTranscript = React.useCallback(async () => {
    setLoadingTranscript(true);
    setTranscriptError(null);
    try {
      const data = await getSessionTranscript(sessionId);
      setTranscript(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transcript currently unavailable";
      setTranscriptError(msg);
    } finally {
      setLoadingTranscript(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    let isCancelled = false;

    void getSessionRecording(sessionId)
      .then((data) => {
        if (!isCancelled) {
          setRecording(data);
          setRecordingError(null);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : "Recording currently unavailable";
          setRecordingError(msg);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingRecording(false);
        }
      });

    void getSessionTranscript(sessionId)
      .then((data) => {
        if (!isCancelled) {
          setTranscript(data);
          setTranscriptError(null);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : "Transcript currently unavailable";
          setTranscriptError(msg);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingTranscript(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [sessionId]);

  // Refresh playback URL (e.g. on expiration or initial load)
  const handleRefreshPlaybackUrl = React.useCallback(async () => {
    try {
      const data = await getSessionRecording(sessionId);
      setRecording(data);
      return data.playback_url ?? null;
    } catch {
      return null;
    }
  }, [sessionId]);

  // When fellow clicks a transcript timestamp:
  const handleSeekFromTranscript = (seconds: number) => {
    setSeekTargetTime(seconds);
    // Reset seekTargetTime shortly so subsequent clicks on same second re-trigger
    setTimeout(() => setSeekTargetTime(null), 100);
  };

  const hasTldvRecording = Boolean(recording?.has_recording);
  const hasTldvTranscript = Boolean(transcript?.has_transcript && transcript?.segments?.length);

  return (
    <div className="space-y-6">
      {/* Top Header Row with status badges */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[var(--color-border-default)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Recording & AI Transcript
            </h2>

            {recording?.duration_seconds ? (
              <Badge variant="muted" size="sm">
                {formatTime(recording.duration_seconds)}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Watch the session playback in-portal and search the synchronized AI transcript.
          </p>
        </div>

        {/* Refresh All Button */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchRecording();
              fetchTranscript();
            }}
            disabled={loadingRecording || loadingTranscript}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loadingRecording || loadingTranscript ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content Area: Vertical Stacked Layout (Video first at 100% width, Transcript directly below at 100% width) */}
      <div className="space-y-8">
        {/* Section 1: Video Player (100% available width, 16:9 aspect ratio) */}
        <section aria-label="Session Video Recording" className="w-full space-y-4">
          <RecordingPlayer
            key={sessionId}
            playbackUrl={effectivePlaybackUrl}
            isSeekable={isSeekable}
            status={recording?.status ?? "unavailable"}
            durationSeconds={recording?.duration_seconds}
            expiresAt={null}
            isLoading={loadingRecording}
            error={recordingError}
            onRefreshUrl={handleRefreshPlaybackUrl}
            onTimeUpdate={setCurrentTime}
            seekTargetTime={seekTargetTime}
            legacyUrl={legacyRecordingUrl}
            title={sessionTitle}
          />

          {/* Legacy Recording fallback or secondary reference */}
          {hasTldvRecording && legacyRecordingUrl && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-3.5 text-xs">
              <span className="text-[var(--color-text-muted)]">
                External / Legacy Recording Backup:
              </span>
              <a
                href={legacyRecordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-brand-blue)] hover:underline"
              >
                Open External Link
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Legacy-only Recording (when tl;dv is not available) */}
          {!hasTldvRecording && !loadingRecording && legacyRecordingUrl && (
            <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[var(--color-brand-orange)]">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                      External Session Recording
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      This recording is hosted externally (e.g. Google Drive / Zoom).
                    </p>
                  </div>
                </div>
                <Badge variant="outline" size="sm">
                  Legacy
                </Badge>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--color-border-default)]">
                <a
                  href={legacyRecordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--color-brand-orange)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-brand-orange-hover)] transition-colors shadow-xs"
                >
                  <Film className="h-3.5 w-3.5" />
                  Watch External Recording
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Section 2: AI Transcript Viewer (100% available width directly below video) */}
        <section aria-label="Synchronized AI Transcript" className="w-full space-y-4">
          <TranscriptViewer
            transcript={transcript}
            isLoading={loadingTranscript}
            error={transcriptError}
            currentTime={currentTime}
            onSeek={handleSeekFromTranscript}
            legacyTranscriptUrl={legacyTranscriptUrl}
            onRefresh={fetchTranscript}
          />

          {/* Legacy Transcript fallback info if both exist */}
          {hasTldvTranscript && legacyTranscriptUrl && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-3.5 text-xs">
              <span className="text-[var(--color-text-muted)]">
                Legacy Transcript Document:
              </span>
              <a
                href={legacyTranscriptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-brand-blue)] hover:underline"
              >
                Open Document
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
