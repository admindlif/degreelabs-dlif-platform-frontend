"use client";

import * as React from "react";
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Play,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime } from "./recording-player";
import { SessionTranscriptResponse } from "@/lib/api/types";

export interface TranscriptViewerProps {
  transcript: SessionTranscriptResponse | null;
  isLoading: boolean;
  error?: string | null;
  currentTime: number;
  onSeek: (seconds: number) => void;
  legacyTranscriptUrl?: string | null;
  onRefresh?: () => void;
}

export function TranscriptViewer({
  transcript,
  isLoading,
  error,
  currentTime,
  onSeek,
  legacyTranscriptUrl,
  onRefresh,
}: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [autoScroll, setAutoScroll] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const activeSegmentRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const segments = React.useMemo(() => transcript?.segments || [], [transcript?.segments]);
  const status = transcript?.status || (transcript?.has_transcript ? "ready" : "unavailable");

  // Determine active segment index based on currentTime
  const activeSegmentIndex = React.useMemo(() => {
    if (!segments.length) return -1;
    return segments.findIndex((seg, idx) => {
      const nextSeg = segments[idx + 1];
      const endTime = seg.end_time ?? (nextSeg ? nextSeg.start_time : seg.start_time + 10);
      return currentTime >= seg.start_time && currentTime < endTime;
    });
  }, [segments, currentTime]);

  // Auto-scroll to active segment when video plays
  React.useEffect(() => {
    if (autoScroll && activeSegmentRef.current && scrollContainerRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeSegmentIndex, autoScroll]);

  // Filter segments by search query
  const filteredSegments = React.useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const lower = searchQuery.toLowerCase();
    return segments.filter(
      (seg) =>
        seg.text.toLowerCase().includes(lower) ||
        (seg.speaker && seg.speaker.toLowerCase().includes(lower))
    );
  }, [segments, searchQuery]);

  const handleCopyFullTranscript = async () => {
    const textToCopy =
      transcript?.full_text ||
      segments
        .map((s) => `[${formatTime(s.start_time)}] ${s.speaker || "Speaker"}: ${s.text}`)
        .join("\n\n");

    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  // Helper to highlight matching search text
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="rounded-xs bg-amber-200 px-0.5 text-neutral-900 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // State 1: Loading
  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-6 text-center">
        <RefreshCw className="h-6 w-6 animate-spin text-[var(--color-brand-orange)]" />
        <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">
          Loading AI transcript...
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Fetching speaker diarization and time-coded transcript
        </p>
      </div>
    );
  }

  // State 2: Processing by tl;dv
  if (status === "processing") {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <FileText className="h-5 w-5 animate-pulse" />
        </div>
        <Badge variant="gold" size="sm" className="mt-3">
          AI Transcription In Progress
        </Badge>
        <h4 className="mt-2 text-sm font-bold text-amber-950">
          tl;dv is transcribing this session
        </h4>
        <p className="mt-1 max-w-sm text-xs text-amber-800">
          Speaker identification and searchable timestamps are being generated. You can watch the recording in the meantime.
        </p>
        {onRefresh && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            className="mt-4 bg-white hover:bg-amber-100 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            Check Transcript Status
          </Button>
        )}
      </div>
    );
  }

  // State 3: Unavailable / Error
  if (error || !transcript?.has_transcript || segments.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-[var(--color-text-muted)]">
          <FileText className="h-5 w-5" />
        </div>
        <h4 className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">
          {error || "Transcript Not Available"}
        </h4>
        <p className="mt-1 max-w-sm text-xs text-[var(--color-text-muted)]">
          {error
            ? "Unable to retrieve session transcript."
            : "No time-coded transcript has been attached to this session yet."}
        </p>

        {legacyTranscriptUrl && (
          <div className="mt-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-3 text-xs">
            <span className="font-semibold text-[var(--color-text-primary)]">Legacy Transcript: </span>
            <a
              href={legacyTranscriptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-[var(--color-brand-blue)] hover:underline"
            >
              Open External Transcript
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    );
  }

  // State 4: Interactive Transcript View
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--color-border-default)] bg-white shadow-xs overflow-hidden">
      {/* Header with Search and Actions */}
      <div className="border-b border-[var(--color-border-default)] p-3.5 sm:p-4 bg-[var(--color-bg-canvas)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in transcript..."
              aria-label="Search transcript"
              className="w-full rounded-xl border border-[var(--color-border-default)] bg-white py-1.5 pl-8 pr-8 text-xs font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-hidden focus:border-[var(--color-brand-orange)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons: Auto-scroll toggle & Copy transcript */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAutoScroll(!autoScroll)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors ${
                autoScroll
                  ? "border-[var(--color-brand-orange)] bg-[var(--color-brand-orange-subtle)] text-[var(--color-brand-orange)]"
                  : "border-[var(--color-border-default)] bg-white text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
              title="Automatically keep current spoken segment in view"
            >
              <Clock className="h-3 w-3" />
              Auto-scroll
            </button>

            <button
              type="button"
              onClick={handleCopyFullTranscript}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-default)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--color-text-body)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)] transition-colors"
              title="Copy entire transcript to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search match stats */}
        {searchQuery.trim() && (
          <div className="mt-2 text-[11px] font-semibold text-[var(--color-text-muted)]">
            Found {filteredSegments.length} {filteredSegments.length === 1 ? "match" : "matches"}
          </div>
        )}
      </div>

      {/* Segments List container */}
      <div
        ref={scrollContainerRef}
        className="divide-y divide-[var(--color-border-default)] overflow-y-auto max-h-[520px] p-3 sm:p-4 space-y-2 [scrollbar-width:thin]"
      >
        {filteredSegments.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
            No segments match &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          filteredSegments.map((segment, index) => {
            const originalIndex = segments.indexOf(segment);
            const isActive = originalIndex === activeSegmentIndex;

            return (
              <div
                key={index}
                ref={isActive ? activeSegmentRef : null}
                className={`group rounded-xl p-3 transition-all duration-150 ${
                  isActive
                    ? "border-2 border-[var(--color-brand-orange)] bg-[var(--color-brand-orange-subtle)]/30 shadow-xs"
                    : "border border-transparent hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-subtle)]"
                }`}
              >
                {/* Header row: Speaker and Clickable timestamp */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[10px] font-bold text-[var(--color-brand-navy)] border border-[var(--color-border-default)]">
                      <User className="h-3 w-3" />
                    </span>
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">
                      {segment.speaker || "Speaker"}
                    </span>
                  </div>

                  {/* Clickable timestamp badge */}
                  <button
                    type="button"
                    onClick={() => onSeek(segment.start_time)}
                    className="inline-flex items-center gap-1 rounded-md bg-[var(--color-bg-subtle)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)] hover:text-white transition-colors cursor-pointer"
                    title={`Jump video to ${formatTime(segment.start_time)}`}
                  >
                    <Play className="h-2.5 w-2.5 fill-current opacity-70 group-hover:opacity-100" />
                    {formatTime(segment.start_time)}
                  </button>
                </div>

                {/* Segment Text */}
                <p className="text-xs leading-relaxed text-[var(--color-text-body)]">
                  {renderHighlightedText(segment.text, searchQuery)}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Footer information */}
      {transcript?.provider && (
        <div className="border-t border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-2 text-[10px] font-semibold text-[var(--color-text-muted)] flex items-center justify-between">
          <span>Provider: {transcript.provider.toUpperCase()} AI Transcription</span>
          <span>Click any timestamp to play from that moment</span>
        </div>
      )}
    </div>
  );
}
