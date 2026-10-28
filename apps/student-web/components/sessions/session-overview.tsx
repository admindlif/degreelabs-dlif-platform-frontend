"use client";

import * as React from "react";
import { Compass, FileText, Target, AlertCircle, RefreshCw, BookOpen } from "lucide-react";

import { getSessionOverview } from "@/lib/api/discover";
import { SessionOverviewData } from "@/lib/api/types";

interface SessionOverviewProps {
  sessionId: string;
  weekNumber?: number | null;
  sessionNumber?: number | null;
  phaseCode?: string | null;
}

export function SessionOverview({
  sessionId,
  weekNumber,
  sessionNumber,
  phaseCode = "DISCOVER",
}: SessionOverviewProps) {
  const [overview, setOverview] = React.useState<SessionOverviewData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchOverview = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSessionOverview(sessionId);
      setOverview(data);
    } catch (err: unknown) {
      console.error("Failed to load session overview:", err);
      setError("Unable to load session overview. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  // Loading skeleton matching tab styles
  if (loading) {
    return (
      <div className="mt-8 pt-8 border-t border-[var(--color-border-default)] space-y-4 animate-pulse">
        <div className="space-y-1.5">
          <div className="h-3 w-40 rounded bg-[var(--color-bg-subtle)]" />
          <div className="h-5 w-44 rounded bg-[var(--color-bg-subtle)]" />
          <div className="h-4 w-72 rounded bg-[var(--color-bg-subtle)]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5 sm:p-6 space-y-3 min-h-[160px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-[var(--color-bg-subtle)]" />
                <div className="h-4 w-28 rounded bg-[var(--color-bg-subtle)]" />
              </div>
              <div className="space-y-2 pt-1">
                <div className="h-3.5 w-full rounded bg-[var(--color-bg-subtle)]" />
                <div className="h-3.5 w-5/6 rounded bg-[var(--color-bg-subtle)]" />
                <div className="h-3.5 w-2/3 rounded bg-[var(--color-bg-subtle)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Graceful empty state: Session 0 Induction or canonical overview not published
  if (!overview && !error) {
    return null;
  }

  // Independent error state: Session Details above remains 100% functional
  if (error) {
    return (
      <div className="mt-8 pt-8 border-t border-[var(--color-border-default)]">
        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--color-brand-orange)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Session Overview Unavailable
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {error}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void fetchOverview()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-blue)] hover:underline shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!overview) return null;

  // Derive resolved canonical numbers
  const displayPhase = overview.phase_code || phaseCode || "DISCOVER";
  const displaySessionNumber = overview.session_number ?? sessionNumber ?? 1;
  const displayWeekNumber =
    weekNumber && weekNumber > 0
      ? weekNumber
      : Math.ceil(displaySessionNumber / 3);

  return (
    <section
      aria-labelledby="session-overview-heading"
      className="mt-8 pt-8 border-t border-[var(--color-border-default)] space-y-6"
    >
      {/* Section Header with Eyebrow — same font & size hierarchy as Session Details */}
      <div>
        <p className="text-xs font-semibold tracking-wider uppercase text-[var(--color-brand-blue)] mb-1">
          {displayPhase} · WEEK {displayWeekNumber} · SESSION {displaySessionNumber}
        </p>
        <h2 id="session-overview-heading" className="text-lg font-bold">
          Session Overview
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Review the core learning objectives, focus area, and required evidence.
        </p>
      </div>

      {/* Premium Option B: Three Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* Card 1: PURPOSE */}
        <div className="group relative flex flex-col rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-[var(--color-brand-blue-light)]/40 transition-all duration-200">
          <div className="absolute top-0 left-5 right-5 h-[2px] bg-gradient-to-r from-[var(--color-brand-blue)] to-[var(--color-brand-blue-light)] rounded-full opacity-80" />

          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-blue-subtle)] text-[var(--color-brand-blue)] ring-1 ring-[var(--color-brand-blue)]/10">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--color-brand-blue)] block leading-none mb-1">
                Section 1
              </span>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">
                PURPOSE
              </h3>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-[var(--color-text-body)] flex-1">
            {overview.purpose}
          </p>
        </div>

        {/* Card 2: WHAT TO EXPLORE */}
        <div className="group relative flex flex-col rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-[var(--color-brand-blue-light)]/40 transition-all duration-200">
          <div className="absolute top-0 left-5 right-5 h-[2px] bg-gradient-to-r from-[var(--color-brand-blue-light)] to-[#60A5FA] rounded-full opacity-80" />

          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-blue-subtle)] text-[var(--color-brand-blue)] ring-1 ring-[var(--color-brand-blue)]/10">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--color-brand-blue)] block leading-none mb-1">
                Section 2
              </span>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">
                WHAT TO EXPLORE
              </h3>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-[var(--color-text-body)] flex-1">
            {overview.what_to_explore}
          </p>
        </div>

        {/* Card 3: WORKING EVIDENCE */}
        <div className="group relative flex flex-col rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-[var(--color-brand-blue-light)]/40 transition-all duration-200">
          <div className="absolute top-0 left-5 right-5 h-[2px] bg-gradient-to-r from-[#60A5FA] to-[var(--color-brand-navy-light)] rounded-full opacity-80" />

          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-blue-subtle)] text-[var(--color-brand-blue)] ring-1 ring-[var(--color-brand-blue)]/10">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--color-brand-blue)] block leading-none mb-1">
                Section 3
              </span>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">
                WORKING EVIDENCE
              </h3>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-[var(--color-text-body)] flex-1">
            {overview.working_evidence}
          </p>
        </div>
      </div>
    </section>
  );
}
