import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CohortSummary,
  DiscoverProgress,
  PhaseSummary,
  SessionSummary,
} from "@/lib/api/types";

interface DiscoverHeroProps {
  cohort?: CohortSummary | null;
  phase?: PhaseSummary | null;
  progress?: DiscoverProgress | null;
  nextSession?: SessionSummary | null;
}

export function DiscoverHero({
  cohort,
  phase,
  progress,
  nextSession,
}: DiscoverHeroProps) {
  const cohortLabel = cohort?.name ?? "DLIF Fellow";

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6 sm:p-8 md:p-10">
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[var(--color-brand-orange-subtle)] opacity-60 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[var(--color-brand-blue-subtle)] opacity-50 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="min-w-0 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="blue" size="sm" className="max-w-full truncate">
              {cohortLabel}
            </Badge>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
              DISCOVER (THINK) → VALIDATE (PROVE) → GROW (DELIVER)
            </span>
          </div>

          <h1 className="break-words text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] md:text-5xl">
            {phase?.name ?? "Fellowship"}
          </h1>

          <p className="text-lg font-medium leading-relaxed text-[var(--color-text-body)] md:text-xl">
            A 4-week strategic problem-solving apprenticeship.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5 shadow-xs lg:w-auto lg:min-w-[280px]">
          {progress ? (
            <>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold">
                <span className="text-[var(--color-text-secondary)]">DISCOVER Progress</span>
                <span className="text-right font-bold text-[var(--color-brand-orange)]">
                  Week {progress.current_week} of {progress.total_weeks} • {progress.percentage}%
                </span>
              </div>

              <div
                className="mb-3 grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(progress.total_weeks, 1)}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: progress.total_weeks }).map((_, index) => {
                  const weekNumber = index + 1;
                  const allCompleted = progress.percentage === 100;
                  const completed = allCompleted || weekNumber < progress.current_week;
                  const current = !allCompleted && weekNumber === progress.current_week;
                  const state = completed
                    ? "Completed"
                    : current
                      ? "Current"
                      : "Upcoming";

                  return (
                    <div
                      key={weekNumber}
                      className={`h-2 rounded-full border ${completed
                        ? "border-[var(--color-brand-orange)] bg-[var(--color-brand-orange)]"
                        : current
                          ? "border-[var(--color-brand-orange)] bg-[var(--color-brand-orange-subtle)]"
                          : "border-[var(--color-border-default)] bg-[var(--color-border-default)]"
                      }`}
                      title={`Week ${weekNumber}: ${state}`}
                    />
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />
                  {progress.completed_sessions} of {progress.total_sessions} Sessions done
                </span>
                {nextSession && (
                  <span>
                    {nextSession.session_number === 0 ? "Induction" : "Next"}: Session {nextSession.session_number}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              Progress is unavailable.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
