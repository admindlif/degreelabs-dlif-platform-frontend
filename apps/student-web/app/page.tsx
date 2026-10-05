"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { DiscoverHero } from "@/components/discover/discover-hero";
import { LiveSessionSpotlight } from "@/components/discover/live-session-spotlight";
import { FellowToolkit } from "@/components/discover/fellow-toolkit";
import { FourWeekRoadmap } from "@/components/discover/four-week-roadmap";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getFellowContext } from "@/lib/api/fellow";
import { getDiscoverOverview, getDiscoverWeeks } from "@/lib/api/discover";
import { DiscoverOverview, DiscoverWeek, FellowContext } from "@/lib/api/types";


const DASHBOARD_ERROR_MESSAGE = "Unable to load your fellowship dashboard.";

export default function DiscoverHomePage() {
  const [context, setContext] = React.useState<FellowContext | null>(null);
  const [overview, setOverview] = React.useState<DiscoverOverview | null>(null);
  const [weeks, setWeeks] = React.useState<DiscoverWeek[] | null>(null);
  const [retrying, setRetrying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [awaitingCohort, setAwaitingCohort] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setError(null);
      setAwaitingCohort(false);

      // First check whether the Fellow has a cohort assigned
      let fellowContext: FellowContext;

      try {
        fellowContext = await getFellowContext();
      } catch (err) {
        // No active cohort = expected state, not an error
        if (
          err instanceof ApiError &&
          err.status === 404 &&
          typeof err.data === "object" &&
          err.data !== null &&
          "detail" in err.data &&
          typeof err.data.detail === "string" &&
          err.data.detail.toLowerCase().includes("no active cohort enrollment")
        ) {
          setContext(null);
          setOverview(null);
          setWeeks(null);
          setAwaitingCohort(true);
          return;
        }

        // Any other error is a real dashboard error
        throw err;
      }

      // Cohort exists
      setContext(fellowContext);

      // Only load dashboard data after context succeeds
      const [overviewResult, weeksResult] = await Promise.allSettled([
        getDiscoverOverview(),
        getDiscoverWeeks(),
      ]);

      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value);
      } else {
        throw overviewResult.reason;
      }

      if (weeksResult.status === "fulfilled") {
        setWeeks(weeksResult.value);
      } else {
        throw weeksResult.reason;
      }

      setError(null);
      setAwaitingCohort(false);
    } catch (err) {
      console.error("Failed to load fellowship dashboard:", err);

      setAwaitingCohort(false);
      setError(DASHBOARD_ERROR_MESSAGE);
    } finally {
      setRetrying(false);
    }
  }, []);

  const retryLoad = React.useCallback(() => {
    setRetrying(true);
    setError(null);
    setAwaitingCohort(false);
    void loadData();
  }, [loadData]);

  React.useEffect(() => {
    queueMicrotask(() => void loadData());
  }, [loadData]);

  // Fellow is logged in but has not been assigned to a cohort yet
  if (awaitingCohort) {
    return (
      <PortalShell breadcrumbItems={["Overview"]} context={null}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--color-border-default)] bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-background-subtle)]">
              <span className="text-2xl">🎓</span>
            </div>

            <h1 className="mt-6 text-2xl font-semibold text-[var(--color-text-primary)]">
              Your fellowship journey is almost ready
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
              You’re successfully registered as a Fellow. Your cohort assignment
              is currently being finalized. Once you’re assigned to a cohort,
              your fellowship schedule, resources, and learning activities will
              appear here.
            </p>

            <p className="mt-6 text-sm font-medium text-[var(--color-text-primary)]">
              You don’t need to do anything right now. We’ll update your portal
              once your cohort assignment is complete.
            </p>
          </div>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      breadcrumbItems={["Overview"]}
      nextSession={overview?.next_session}
      context={context}
    >
      {error && (
        <div role="alert" className="mb-6 flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" onClick={retryLoad} disabled={retrying}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${retrying ? "animate-spin" : ""}`} />
            {retrying ? "Retrying..." : "Retry"}
          </Button>
        </div>
      )}

      {/* Zone 1: Discover Hero Banner with Serif Highlight & Progress */}
      <DiscoverHero
        cohort={context?.cohort}
        phase={context?.current_phase}
        progress={overview?.progress}
        nextSession={overview?.next_session}
      />

      {/* Grid: Zone 2 (Spotlight) + Zone 3 (Fellow Toolkit & Team) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <LiveSessionSpotlight session={overview?.next_session} />
        </div>
        <div className="lg:col-span-4">
          <FellowToolkit />
        </div>
      </div>

      {/* Zone 4: Full 4-Week Journey Stepper & Sessions */}
      <FourWeekRoadmap weeks={weeks} />
    </PortalShell>
  );
}
