"use client";

import * as React from "react";
import { ArrowRight, ArrowDown, LockKeyhole, CheckCircle2, Clock } from "lucide-react";
import { FellowshipPhase } from "@/lib/api/types";

const STAGES = [
  {
    code: "DISCOVER",
    phaseNumber: "01",
    principle: "THINK",
    duration: "4 weeks",
    color: "var(--color-brand-orange)",
    bgGradient: "linear-gradient(145deg, #FFF7F3 0%, #FFFFFF 72%)",
    activeBorder: "border-[#FF510E]/40",
    activeShadow: "shadow-[0_4px_20px_rgba(255,81,14,0.08)]",
    badgeBg: "var(--color-brand-orange-subtle)",
    badgeColor: "var(--color-brand-orange)",
    dotColor: "bg-[var(--color-brand-orange)]",
    connectorGradient: "from-orange-300 to-blue-300",
    connectorArrowColor: "text-blue-500",
  },
  {
    code: "VALIDATE",
    phaseNumber: "02",
    principle: "PROVE",
    duration: "4 weeks",
    color: "var(--color-brand-blue)",
    bgGradient: "linear-gradient(145deg, #F0F5FE 0%, #FFFFFF 72%)",
    activeBorder: "border-[#3877F9]/30",
    activeShadow: "shadow-[0_4px_20px_rgba(56,119,249,0.08)]",
    badgeBg: "var(--color-brand-blue-subtle)",
    badgeColor: "var(--color-brand-blue)",
    dotColor: "bg-[var(--color-brand-blue)]",
    connectorGradient: "from-blue-300 to-indigo-300",
    connectorArrowColor: "text-indigo-400",
  },
  {
    code: "GROW",
    phaseNumber: "03",
    principle: "DELIVER",
    duration: "3–6 months",
    color: "var(--color-brand-navy)",
    bgGradient: "linear-gradient(145deg, #F3F4F9 0%, #FFFFFF 72%)",
    activeBorder: "border-[#13152B]/25",
    activeShadow: "shadow-[0_4px_20px_rgba(19,21,43,0.08)]",
    badgeBg: "#EEF0FA",
    badgeColor: "var(--color-brand-navy)",
    dotColor: "bg-[var(--color-brand-navy)]",
    connectorGradient: "from-indigo-300 to-slate-300",
    connectorArrowColor: "text-slate-400",
  },
] as const;

interface FellowshipJourneyProps {
  currentPhaseCode?: string;
  phases?: FellowshipPhase[];
}

export function FellowshipJourney({
  currentPhaseCode,
  phases,
}: FellowshipJourneyProps) {
  return (
    <section aria-label="Fellowship journey progression" className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Fellowship Journey
        </h2>
        <div className="h-px flex-1 bg-[var(--color-border-default)]" />
      </div>

      {/* Progression row */}
      <div
        className="flex flex-col md:flex-row items-stretch gap-3 lg:gap-4 w-full"
        role="list"
        aria-label="Fellowship stages"
      >
        {STAGES.map((stage, index) => {
          const phaseData = phases?.find(
            (p) => p.code?.toUpperCase() === stage.code.toUpperCase()
          );

          const isCurrent =
            currentPhaseCode?.toUpperCase() === stage.code.toUpperCase();

          const isUnlocked = Boolean(
            phaseData?.can_enter ||
            phaseData?.access_status?.toLowerCase() === "unlocked" ||
            phaseData?.access_status?.toLowerCase() === "active" ||
            (isCurrent && !phaseData)
          );

          const isLocked = !isUnlocked;

          return (
            <React.Fragment key={stage.code}>
              {/* Card Container */}
              <div
                role="listitem"
                aria-label={`Phase ${stage.phaseNumber}: ${stage.code} (${stage.principle})`}
                className={`flex-1 min-w-0 flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                  isCurrent
                    ? `${stage.activeBorder} ${stage.activeShadow} hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,81,14,0.12)]`
                    : isUnlocked
                      ? "border-[var(--color-border-default)] hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md"
                      : "border-[var(--color-border-default)]/80 hover:border-slate-200"
                }`}
                style={{
                  background: stage.bgGradient,
                }}
              >
                {/* Top Row: Phase number + Principle pill + Status indicator */}
                <div className="flex items-center justify-between gap-2 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-mono font-extrabold tracking-widest uppercase"
                      style={{ color: stage.color }}
                    >
                      Phase {stage.phaseNumber}
                    </span>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-widest uppercase"
                      style={{
                        background: stage.badgeBg,
                        color: stage.badgeColor,
                      }}
                    >
                      {stage.principle}
                    </span>
                  </div>

                  {/* Top-right Status Pill */}
                  {isCurrent ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-brand-orange-subtle)] border border-orange-200/90 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-brand-orange)] shadow-xs">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand-orange)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-brand-orange)]"></span>
                      </span>
                      Current
                    </span>
                  ) : isUnlocked ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-white/80 border border-slate-200/90 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                      <LockKeyhole className="h-3 w-3 text-slate-400" />
                      Locked
                    </span>
                  )}
                </div>

                {/* Middle Row: Phase Title & Duration */}
                <div className="py-2 space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                    {stage.code}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{stage.duration}</span>
                  </div>
                </div>

                {/* Bottom Row: Status footer bar */}
                <div className="pt-3 mt-3 border-t border-[var(--color-border-default)]/60 flex items-center justify-between text-xs">
                  {isCurrent ? (
                    <>
                      <span className="font-bold text-[var(--color-brand-orange)]">
                        Active Progression
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
                        Current Phase
                      </span>
                    </>
                  ) : isUnlocked ? (
                    <>
                      <span className="font-bold text-emerald-700">
                        Authorized Access
                      </span>
                      <span className="text-[10px] font-medium text-[var(--color-text-muted)]">
                        Available
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-medium text-[var(--color-text-muted)] truncate max-w-[170px] sm:max-w-none">
                        {index === 1
                          ? "Requires Phase 01 completion"
                          : "Requires Phase 02 approval"}
                      </span>
                      <LockKeyhole className="h-3 w-3 text-slate-400 shrink-0" />
                    </>
                  )}
                </div>
              </div>

              {/* Connecting Indicator between adjacent cards */}
              {index < STAGES.length - 1 && (() => {
                const isConnectorActive = isUnlocked || isCurrent;
                return (
                  <>
                    {/* Desktop / Tablet horizontal connector */}
                    <div
                      aria-hidden="true"
                      className="hidden md:flex items-center justify-center shrink-0 self-center"
                    >
                      <div className="flex items-center">
                        <div
                          className={`h-0.5 w-3 lg:w-4 rounded-full ${
                            isConnectorActive
                              ? `bg-gradient-to-r ${stage.connectorGradient}`
                              : "bg-slate-200"
                          }`}
                        />
                        <ArrowRight
                          className={`h-4 w-4 -ml-1 ${
                            isConnectorActive
                              ? stage.connectorArrowColor
                              : "text-slate-300"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Mobile vertical downward connector */}
                    <div
                      aria-hidden="true"
                      className="flex md:hidden items-center justify-center py-1"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-0.5 h-3 rounded-full ${
                            isConnectorActive
                              ? `bg-gradient-to-b ${stage.connectorGradient}`
                              : "bg-slate-200"
                          }`}
                        />
                        <ArrowDown
                          className={`h-3.5 w-3.5 -mt-0.5 ${
                            isConnectorActive
                              ? stage.connectorArrowColor
                              : "text-slate-300"
                          }`}
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
