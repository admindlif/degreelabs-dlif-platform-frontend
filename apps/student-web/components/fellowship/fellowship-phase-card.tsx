"use client";

import * as React from "react";
import Link from "next/link";
import {
  LockKeyhole,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FellowshipPhase } from "@/lib/api/types";
import { cn } from "@/lib/utils";

// ─── Static phase content ─────────────────────────────────────────────────────
//  Used when backend doesn't return content fields (it may add them later).

const DISCOVER_WEEKS = [
  {
    week: 1,
    title: "Discover the Real Problem",
    description:
      "Build business context, understand relevant workflows and stakeholders, distinguish evidence from assumptions, and define an evidence-backed problem frame.",
  },
  {
    week: 2,
    title: "Create Strategic Possibilities",
    description:
      "Research alternatives, develop at least three materially different strategic possibilities, test critical assumptions, and defend a choice.",
  },
  {
    week: 3,
    title: "Design the Strategy",
    description:
      "Convert the selected direction into an integrated strategy and credible execution architecture with dependencies, risks, and success measures.",
  },
  {
    week: 4,
    title: "Build the Case for Action",
    description:
      "Create and defend a decision-grade Executive Proposal, Company Presentation, and Strategic Design Portfolio.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(status?: string | null, canEnter?: boolean) {
  const normalized = status?.toLowerCase();
  if (normalized === "unlocked" || (canEnter && normalized !== "coming_soon" && normalized !== "locked")) {
    return "UNLOCKED";
  }
  if (normalized === "active") return "ACTIVE";
  if (normalized === "coming_soon") return "COMING SOON";
  return "LOCKED";
}

function statusBadgeVariant(status?: string | null, canEnter?: boolean) {
  const normalized = status?.toLowerCase();
  if (
    normalized === "unlocked" ||
    normalized === "active" ||
    (canEnter && normalized !== "coming_soon" && normalized !== "locked")
  ) {
    return "success" as const;
  }
  if (normalized === "coming_soon") return "blue" as const;
  return "muted" as const;
}

// ─── Discover card details ────────────────────────────────────────────────────

function DiscoverCardBody({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm leading-relaxed text-[var(--color-text-body)]">
        Understand the real company problem and design a defensible strategic
        response. 12 sessions across four structured weeks.
      </p>

      {/* Week-by-week accordion */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-4 py-2.5 text-left text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)] focus-visible:ring-offset-1"
      >
        <span>{expanded ? "Hide" : "Show"} weekly milestones</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform duration-200 motion-reduce:transition-none",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <ol className="space-y-3" aria-label="Discover weekly milestones">
          {DISCOVER_WEEKS.map(({ week, title, description }) => (
            <li key={week} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-orange-subtle)] text-[10px] font-extrabold text-[var(--color-brand-orange)]">
                {week}
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--color-text-primary)]">
                  Week {week} — {title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ─── Validate / Grow card details ─────────────────────────────────────────────

function ValidateCardBody() {
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm leading-relaxed text-[var(--color-text-body)]">
        Prove enough critical assumptions to justify execution. The company
        becomes an active validation partner.
      </p>
      <ul className="space-y-1.5 text-xs text-[var(--color-text-muted)]">
        {[
          "Test assumptions behind the selected strategic direction",
          "Evaluate desirability, feasibility, viability and operability",
          "Refine the solution and plan based on evidence",
          "Work towards company approval to move into paid implementation",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-brand-blue)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GrowCardBody() {
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm leading-relaxed text-[var(--color-text-body)]">
        Execute the validated solution and create measurable business impact
        through company-approved paid implementation.
      </p>
      <ul className="space-y-1.5 text-xs text-[var(--color-text-muted)]">
        {[
          "Execute work against company milestones",
          "Work with mentor supervision",
          "Participate in company checkpoints",
          "Deliver measurable business impact",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-brand-navy)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Phase card ───────────────────────────────────────────────────────────────

interface FellowshipPhaseCardProps {
  phase: FellowshipPhase;
  index: number;
}

const PHASE_COLORS: Record<string, { accent: string; subtle: string }> = {
  DISCOVER: {
    accent: "var(--color-brand-orange)",
    subtle: "var(--color-brand-orange-subtle)",
  },
  VALIDATE: {
    accent: "var(--color-brand-blue)",
    subtle: "var(--color-brand-blue-subtle)",
  },
  GROW: {
    accent: "var(--color-brand-navy)",
    subtle: "#EEF0FA",
  },
};

// Orange-led gradient system — DISCOVER is warmest, VALIDATE and GROW carry a
// faint orange-warm undertone so the entire phase section feels connected.
const CARD_GRADIENTS: Record<string, { bg: string; header: string; locked: string; lockedHeader: string; borderColor: string; glow: string }> = {
  DISCOVER: {
    // Richest orange-to-white — primary active phase
    bg: "linear-gradient(160deg, #FFF3ED 0%, #FFF8F5 40%, #FFFFFF 100%)",
    header: "linear-gradient(135deg, #FFEEE4 0%, #FFF7F3 55%, #FFFFFF 100%)",
    locked: "linear-gradient(160deg, #FFF8F5 0%, #FFFBF9 50%, #FFFFFF 100%)",
    lockedHeader: "linear-gradient(135deg, #FFF5F0 0%, #FFFAF8 60%, #FFFFFF 100%)",
    borderColor: "rgba(255, 81, 14, 0.18)",
    glow: "rgba(255, 81, 14, 0.22)",
  },
  VALIDATE: {
    // Warm orange-peach → soft white — carries the orange warmth subtly
    bg: "linear-gradient(160deg, #FFF6F1 0%, #FFF9F6 35%, #F9F6FF 70%, #FFFFFF 100%)",
    header: "linear-gradient(135deg, #FFF0E8 0%, #FFF5F0 45%, #F8F5FF 75%, #FFFFFF 100%)",
    locked: "linear-gradient(160deg, #FFF8F4 0%, #FFFAF7 50%, #FAFBFF 80%, #FFFFFF 100%)",
    lockedHeader: "linear-gradient(135deg, #FFF4EF 0%, #FFF8F4 55%, #FAFBFF 80%, #FFFFFF 100%)",
    borderColor: "rgba(255, 81, 14, 0.10)",
    glow: "rgba(56, 119, 249, 0.18)",
  },
  GROW: {
    // Warm amber-tinted → subtle navy cool — orange warmth fades into navy
    bg: "linear-gradient(160deg, #FFF5EF 0%, #FFF8F4 30%, #F4F5FA 65%, #FFFFFF 100%)",
    header: "linear-gradient(135deg, #FFEEE4 0%, #FFF3ED 40%, #EEEFFE 75%, #FFFFFF 100%)",
    locked: "linear-gradient(160deg, #FFF7F3 0%, #FFF9F6 40%, #F5F6FB 70%, #FFFFFF 100%)",
    lockedHeader: "linear-gradient(135deg, #FFF3EE 0%, #FFF6F2 45%, #EEEFFE 78%, #FFFFFF 100%)",
    borderColor: "rgba(255, 81, 14, 0.08)",
    glow: "rgba(19, 21, 43, 0.12)",
  },
};

const PHASE_DESCRIPTIONS: Record<string, string> = {
  DISCOVER: "Understand the real company problem and design a defensible strategic response.",
  VALIDATE: "Prove enough critical assumptions to justify execution.",
  GROW: "Execute the validated solution and create measurable business impact.",
};

export function FellowshipPhaseCard({
  phase,
  index,
}: FellowshipPhaseCardProps) {
  const [weekExpanded, setWeekExpanded] = React.useState(false);

  const code = phase.code.toUpperCase();
  const colors = PHASE_COLORS[code] ?? PHASE_COLORS.DISCOVER;
  const normalizedStatus = (phase.access_status || "").toLowerCase();

  // Phase is unlocked when can_enter is true, or access_status is explicitly "unlocked" or "active"
  const isUnlocked = Boolean(
    phase.can_enter ||
    normalizedStatus === "unlocked" ||
    normalizedStatus === "active"
  );
  const isComingSoon = normalizedStatus === "coming_soon";
  const isLocked = !isUnlocked && !isComingSoon;

  // Use the active/unlocked card design and existing theme colours
  const isActive = isUnlocked;

  // Destination route
  const phaseRoute =
    code === "DISCOVER"
      ? "/discover"
      : code === "VALIDATE"
        ? "/validate"
        : "/grow";

  const canNavigate = isUnlocked && phase.can_enter !== false;

  const cardGradients = CARD_GRADIENTS[code] ?? CARD_GRADIENTS.DISCOVER;

  return (
    <article
      aria-label={`${phase.code} phase card`}
      className={cn(
        "h-full flex flex-col rounded-2xl border transition-all duration-300 focus-within:ring-2 focus-within:ring-[var(--color-brand-orange)] focus-within:ring-offset-1",
        isActive
          ? cn(
              code === "DISCOVER"
                ? "shadow-[0_4px_28px_rgba(255,81,14,0.10)] hover:shadow-[0_14px_36px_rgba(255,81,14,0.16)] hover:-translate-y-1 motion-reduce:hover:translate-y-0"
                : "shadow-[0_4px_24px_rgba(255,81,14,0.07)] hover:shadow-[0_12px_32px_rgba(255,81,14,0.12)] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            )
          : "shadow-[0_2px_12px_rgba(255,81,14,0.04)]"
      )}
      style={{
        background: isActive ? cardGradients.bg : cardGradients.locked,
        borderColor: cardGradients.borderColor,
      }}
    >
      {/* Card Header */}
      <div
        className="relative overflow-hidden rounded-t-2xl border-b px-6 py-6"
        style={{
          background: isActive ? cardGradients.header : cardGradients.lockedHeader,
          borderColor: cardGradients.borderColor,
        }}
      >
        {/* Orange radial glow in top-right corner — strongest on DISCOVER */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 rounded-full"
          style={{
            width: code === "DISCOVER" ? 160 : 120,
            height: code === "DISCOVER" ? 160 : 120,
            background: `radial-gradient(circle, rgba(255,81,14,${code === "DISCOVER" ? "0.18" : "0.10"}) 0%, transparent 70%)`,
          }}
        />
        {/* Secondary glow — phase-specific accent for depth */}
        {isActive && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-8 -left-8 rounded-full"
            style={{
              width: 96,
              height: 96,
              background: `radial-gradient(circle, ${cardGradients.glow.replace("rgba", "rgba").replace("0.12", "0.14").replace("0.18", "0.20").replace("0.22", "0.22")} 0%, transparent 70%)`,
              opacity: 0.7,
            }}
          />
        )}

        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            {/* Phase index */}
            <span
              className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.2em]"
              style={{ color: colors.accent }}
            >
              Phase {index + 1}
            </span>

            {/* Code + Principle */}
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                {canNavigate ? (
                  <Link
                    href={phaseRoute}
                    className="hover:text-[var(--color-brand-orange)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)] rounded"
                  >
                    {phase.code}
                  </Link>
                ) : (
                  phase.code
                )}
              </h3>
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tracking-widest"
                style={{ background: colors.subtle, color: colors.accent }}
              >
                {phase.principle}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {/* Status badge */}
            <Badge
              variant={statusBadgeVariant(phase.access_status, phase.can_enter)}
              size="sm"
            >
              {isLocked && <LockKeyhole className="h-3 w-3" />}
              {statusLabel(phase.access_status, phase.can_enter)}
            </Badge>

            {/* Duration */}
            <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
              <Clock className="h-3 w-3" />
              {phase.duration}
            </span>
          </div>
        </div>

        {/* Short purpose */}
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
          {PHASE_DESCRIPTIONS[code] ?? ""}
        </p>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col px-6 pb-6">
        {/* Lock notice */}
        {isLocked && phase.lock_reason && (
          <div
            className="mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3"
            style={{
              background: "linear-gradient(135deg, #FFF8F5 0%, #FAFAFA 100%)",
              borderColor: "rgba(255, 81, 14, 0.12)",
            }}
          >
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
            <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
              {phase.lock_reason}
            </p>
          </div>
        )}

        {/* Phase details */}
        {code === "DISCOVER" && (
          <DiscoverCardBody
            expanded={weekExpanded}
            onToggle={() => setWeekExpanded((p) => !p)}
          />
        )}
        {code === "VALIDATE" && <ValidateCardBody />}
        {code === "GROW" && <GrowCardBody />}

        {/* Footer CTA */}
        <div className="mt-auto pt-6">
          {canNavigate ? (
            <Link href={phaseRoute} tabIndex={0} className="block">
              <Button
                variant="primary"
                size="md"
                className="w-full gap-2 font-bold"
              >
                {code === "DISCOVER" ? "Enter Discover" : `Enter ${phase.code}`}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : isComingSoon ? (
            <Button
              variant="secondary"
              size="md"
              disabled
              aria-label={`${phase.code} is coming soon`}
              className="w-full cursor-not-allowed font-medium"
            >
              Coming Soon
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              disabled
              aria-label={`${phase.code} is locked`}
              className="w-full cursor-not-allowed font-medium text-[var(--color-text-muted)]"
            >
              <LockKeyhole className="h-4 w-4" />
              Locked
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
