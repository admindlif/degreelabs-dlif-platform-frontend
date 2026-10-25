"use client";

import * as React from "react";
import { AlertCircle, ArrowRight, LockKeyhole, RefreshCw } from "lucide-react";
import Link from "next/link";
import { FellowshipHero } from "@/components/fellowship/fellowship-hero";

import { FellowshipPhaseCard } from "@/components/fellowship/fellowship-phase-card";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getFellowContext, tryGetFellowHomepage } from "@/lib/api/fellow";
import {
  FellowContext,
  FellowHomepageData,
  FellowshipPhase,
} from "@/lib/api/types";

const HOMEPAGE_ERROR_MESSAGE = "Unable to load your fellowship home.";

const PHASE_METADATA: Record<
  string,
  { title: string; principle: string; duration: string; defaultLockReason: string }
> = {
  DISCOVER: {
    title: "Discover",
    principle: "THINK",
    duration: "4 weeks",
    defaultLockReason: "Complete cohort onboarding to unlock Discover.",
  },
  VALIDATE: {
    title: "Validate",
    principle: "PROVE",
    duration: "4 weeks",
    defaultLockReason:
      "Complete Phase 01: Discover and secure company endorsement to unlock Validate.",
  },
  GROW: {
    title: "Grow",
    principle: "DELIVER",
    duration: "3–6 months",
    defaultLockReason:
      "Requires successful completion of Phase 02: Validate and company approval.",
  },
};

const DEFAULT_PHASE_CODES = ["DISCOVER", "VALIDATE", "GROW"] as const;

function extractPhases(data: FellowHomepageData | null): FellowshipPhase[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.phases)) return obj.phases as FellowshipPhase[];
    if (Array.isArray(obj.data)) return obj.data as FellowshipPhase[];
    if (typeof obj.code === "string" && ("access_status" in obj || "can_enter" in obj)) {
      return [obj as unknown as FellowshipPhase];
    }
  }
  return [];
}

export default function FellowHomePage() {
  const [context, setContext] = React.useState<FellowContext | null>(null);
  const [homepageData, setHomepageData] =
    React.useState<FellowHomepageData | null>(null);
  const [retrying, setRetrying] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<Date | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [awaitingCohort, setAwaitingCohort] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setError(null);
      setAwaitingCohort(false);

      let fellowContext: FellowContext;
      try {
        fellowContext = await getFellowContext();
      } catch (err) {
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
          setHomepageData(null);
          setAwaitingCohort(true);
          return;
        }
        throw err;
      }

      setContext(fellowContext);

      // Fetch homepage data (tryGetFellowHomepage only suppresses 404/422 endpoint-not-found)
      // Any server error or network issue will throw and present the error/retry state.
      const homeRes = await tryGetFellowHomepage();
      if (homeRes) {
        setHomepageData(homeRes);
      }

      setError(null);
      setAwaitingCohort(false);
    } catch (err) {
      console.error("Failed to load fellowship homepage:", err);
      setAwaitingCohort(false);
      setError(HOMEPAGE_ERROR_MESSAGE);
    } finally {
      setRetrying(false);
      setRefreshing(false);
    }
  }, []);

  const retryLoad = React.useCallback(() => {
    setRetrying(true);
    setError(null);
    setAwaitingCohort(false);
    void loadData();
  }, [loadData]);

  const handleRefresh = React.useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await loadData();
      setLastRefreshedAt(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [loadData, refreshing]);

  React.useEffect(() => {
    queueMicrotask(() => void loadData());
  }, [loadData]);

  // Derive phases: preserve exact API access_status, can_enter, lock_reason
  const phases: FellowshipPhase[] = React.useMemo(() => {
    const apiPhases = extractPhases(homepageData);

    return DEFAULT_PHASE_CODES.map((code) => {
      const meta = PHASE_METADATA[code];
      const foundApiPhase = apiPhases.find(
        (p) => p?.code?.toUpperCase() === code
      );

      if (foundApiPhase) {
        const normalizedStatus = (foundApiPhase.access_status || "").toLowerCase();
        const canEnter = Boolean(
          foundApiPhase.can_enter ||
          normalizedStatus === "unlocked" ||
          normalizedStatus === "active"
        );
        return {
          code,
          title: foundApiPhase.title || meta.title,
          principle: foundApiPhase.principle || meta.principle,
          duration: foundApiPhase.duration || meta.duration,
          access_status: foundApiPhase.access_status,
          can_enter: canEnter,
          lock_reason: foundApiPhase.lock_reason ?? null,
        };
      }

      // If the API did not return this phase (e.g. only DISCOVER was returned):
      // Check if context specifically marks it as the current enrolled phase
      const isContextCurrentPhase =
        context?.current_phase?.code?.toUpperCase() === code;

      if (isContextCurrentPhase) {
        return {
          code,
          title: meta.title,
          principle: meta.principle,
          duration: meta.duration,
          access_status: "unlocked",
          can_enter: true,
          lock_reason: null,
        };
      }

      return {
        code,
        title: meta.title,
        principle: meta.principle,
        duration: meta.duration,
        access_status: "locked",
        can_enter: false,
        lock_reason: meta.defaultLockReason,
      };
    });
  }, [homepageData, context]);

  const discoverCanEnter = React.useMemo(() => {
    const discover = phases.find((p) => p.code.toUpperCase() === "DISCOVER");
    return Boolean(discover && discover.can_enter);
  }, [phases]);

  const currentPhaseCode = React.useMemo(() => {
    if (homepageData && !Array.isArray(homepageData) && homepageData.current_phase?.code) {
      return homepageData.current_phase.code;
    }
    if (context?.current_phase?.code) {
      return context.current_phase.code;
    }
    const firstUnlocked = phases.find((p) => p.can_enter);
    return firstUnlocked?.code ?? "DISCOVER";
  }, [homepageData, context, phases]);

  // Fellow is registered but not yet assigned to a cohort
  if (awaitingCohort) {
    return (
      <div className="w-full">
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
              your fellowship phases, schedule, and team resources will appear here.
            </p>


          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {error && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" onClick={retryLoad} disabled={retrying}>
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1 ${retrying ? "animate-spin" : ""}`}
            />
            {retrying ? "Retrying..." : "Retry"}
          </Button>
        </div>
      )}



      <div className="space-y-10">
        {/* Zone 1: Fellowship Hero */}
        <FellowshipHero
          fellow={
            (!Array.isArray(homepageData) && homepageData?.fellow) ||
            context?.fellow
          }
          cohort={
            (!Array.isArray(homepageData) && homepageData?.cohort) ||
            context?.cohort
          }
        />



        {/* Zone 3: Phase Cards */}
        <section aria-label="Fellowship phase progression" className="space-y-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Fellowship Phases
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Structured in three connected phases from problem discovery to validated solutions and company delivery.
              </p>
            </div>

            {discoverCanEnter ? (
              <Link
                href="/discover"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand-orange)] hover:underline"
              >
                <span>Go directly to Discover Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
                <LockKeyhole className="h-3.5 w-3.5" />
                <span>Discover Dashboard is locked</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {phases.map((phase, index) => (
              <FellowshipPhaseCard
                key={phase.code}
                phase={phase}
                index={index}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
