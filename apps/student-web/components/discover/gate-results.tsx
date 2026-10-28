"use client";

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Trophy,
  Loader2,
  ClipboardList,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
} from "lucide-react";
import Link from "next/link";
import { getDiscoverGateAssessment } from "@/lib/api/discover";
import { PhaseGateAssessmentResponse, PhaseGateDimension, FellowContext } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";

// Exact handbook criteria from Page 9 of DLIF Fellow Handbook – DISCOVER v1.0 FINAL
export const HANDBOOK_DIMENSIONS = [
  {
    key: "business_understanding",
    title: "Business Understanding",
    sequence: 1,
    observableEvidence:
      "Accurate context, relevant workflow, stakeholder understanding, constraints and economics/value logic.",
  },
  {
    key: "evidence_problem_framing",
    title: "Evidence & Problem Framing",
    sequence: 2,
    observableEvidence:
      "Source quality, distinction between evidence and assumptions, diagnosis quality, bounded problem and measurable outcome.",
  },
  {
    key: "strategic_choice",
    title: "Strategic Choice",
    sequence: 3,
    observableEvidence:
      "Quality of alternatives, WWHTBT logic, barrier testing, decision rationale and willingness to revise.",
  },
  {
    key: "execution_thinking",
    title: "Execution Thinking",
    sequence: 4,
    observableEvidence:
      "Internal coherence, operational credibility, dependencies, risks and success measures.",
  },
  {
    key: "professional_communication",
    title: "Professional Communication",
    sequence: 5,
    observableEvidence:
      "Clarity, prioritisation, evidence integrity, response to challenge and company usability.",
  },
];

interface GateResultsProps {
  context?: FellowContext | null;
}

export function DiscoverGateResults({ context }: GateResultsProps) {
  const [assessment, setAssessment] = React.useState<PhaseGateAssessmentResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getDiscoverGateAssessment()
      .then((data) => {
        if (isMounted) {
          setAssessment(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load gate assessment:", err);
          setError("Unable to load gate assessment results.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isValidateUnlocked =
    assessment?.validate_unlocked === true ||
    context?.current_phase?.code === "VALIDATE" ||
    context?.current_phase?.code === "GROW";

  const isSubmitted =
    assessment &&
    assessment.status !== "not_submitted" &&
    assessment.dimensions &&
    assessment.dimensions.length > 0;

  // Progression status calculation
  const getProgressionStatus = () => {
    if (isValidateUnlocked) {
      return {
        label: "Progression Approved – VALIDATE Unlocked",
        variant: "success" as const,
        description: "Your team has officially been unlocked for Phase 2 – VALIDATE.",
      };
    }
    if (!isSubmitted) {
      return {
        label: "Awaiting Mentor Assessment",
        variant: "muted" as const,
        description:
          "Your assigned Mentor evaluates your team after DISCOVER Session 12 – Final DISCOVER Review.",
      };
    }
    return {
      label: "Awaiting Admin Decision",
      variant: "brand" as const,
      description: "Mentor assessment is submitted and pending Admin review and company shortlisting.",
    };
  };

  const statusInfo = getProgressionStatus();

  // Calculate totals
  const dimensions = assessment?.dimensions || [];
  const clearedCount =
    assessment?.total_cleared ??
    dimensions.filter((d) => d.is_cleared === true).length;
  const unclearedCount =
    assessment?.total_uncleared ??
    dimensions.filter((d) => d.is_cleared === false).length;

  return (
    <section className="space-y-6" id="discover-gate-results">
      {/* Congratulations Banner when VALIDATE is Unlocked */}
      {isValidateUnlocked && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white shadow-lg animate-in fade-in duration-300">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
                <Trophy className="h-3.5 w-3.5 text-amber-300" />
                <span>Phase Gate Milestone Cleared</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Congratulations! Your team has progressed to VALIDATE.
              </h2>
              <p className="max-w-2xl text-xs sm:text-sm text-emerald-100 leading-relaxed">
                We are pleased to inform you that your team has been approved to progress from
                DISCOVER to <strong>VALIDATE – Phase 2</strong> of the DegreeLabs Impact Fellowship.
                In VALIDATE, your team will focus on testing critical assumptions, strengthening evidence,
                and determining whether your proposed solution is ready for execution.
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-md">
                <Sparkles className="h-4 w-4 text-amber-500" />
                VALIDATE Active
              </span>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        </div>
      )}

      {/* Main Gate Results Card */}
      <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6 shadow-xs space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--color-border-default)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-brand-orange)]">
                <ClipboardList className="h-4 w-4" />
                Phase Gate Evaluation
              </span>
              <Badge variant={statusInfo.variant} size="sm">
                {statusInfo.label}
              </Badge>
            </div>
            <h2 className="text-lg font-extrabold text-[var(--color-navy)]">
              DISCOVER – Gate Assessment Results
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
              Assessment evaluated against the 5 DLIF dimensions
              following the Final DISCOVER Review.
            </p>
          </div>

          {/* Supporting Team & Cohort Details */}
          <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end text-xs text-[var(--color-text-secondary)]">
            {context?.cohort?.name && (
              <span className="flex items-center gap-1 font-semibold text-[var(--color-navy)]">
                <Building2 className="h-3.5 w-3.5 text-[var(--color-brand-orange)]" />
                {context.cohort.name}
              </span>
            )}
            {context?.cohort?.name && (
              <span className="text-[11px] text-[var(--color-text-muted)]">
                {context.cohort.name}
              </span>
            )}
            {assessment?.submitted_at && (
              <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Assessed: {new Date(assessment.submitted_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-xs text-[var(--color-text-muted)]">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-brand-orange)]" />
            <span>Loading gate assessment results...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : !isSubmitted ? (
          /* Empty / Pending State */
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-[var(--color-navy)]">
              Assessment Pending Mentor Submission
            </h3>
            <p className="mx-auto max-w-md text-xs text-[var(--color-text-muted)] leading-relaxed">
              Your assigned Mentor will evaluate your team against the five handbook dimensions
              after <strong>DISCOVER Session 12 – Final DISCOVER Review</strong>. Once submitted,
              your team’s assessment and progression decision will appear here.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-gray-600 border border-gray-200">
                Status: Awaiting Mentor Assessment
              </span>
            </div>
          </div>
        ) : (
          /* Submitted Assessment Table */
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-[var(--color-border-default)] shadow-xs">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] font-bold text-[var(--color-navy)]">
                    <th scope="col" className="w-12 px-4 py-3 text-center">
                      #
                    </th>
                    <th scope="col" className="w-56 px-4 py-3">
                      Dimension
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Observable Evidence (Handbook Page 9)
                    </th>
                    <th scope="col" className="w-36 px-4 py-3 text-center">
                      Assessment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-default)] bg-white">
                  {HANDBOOK_DIMENSIONS.map((item, idx) => {
                    const match = dimensions.find(
                      (d) =>
                        d.dimension_key === item.key ||
                        d.dimension_title?.toLowerCase() === item.title.toLowerCase() ||
                        d.sequence === item.sequence
                    );
                    const isCleared = match?.is_cleared;

                    return (
                      <tr
                        key={item.key}
                        className={`transition-colors ${isCleared === true
                          ? "bg-emerald-50/20 hover:bg-emerald-50/40"
                          : isCleared === false
                            ? "bg-red-50/15 hover:bg-red-50/30"
                            : "hover:bg-[var(--color-bg-subtle)]"
                          }`}
                      >
                        <td className="px-4 py-3.5 text-center font-bold text-[var(--color-text-muted)]">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-[var(--color-navy)] block">
                            {item.title}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[var(--color-text-secondary)] leading-relaxed">
                          {item.observableEvidence}
                          {match?.mentor_comment && (
                            <p className="mt-2 text-[11px] italic text-[var(--color-text-muted)] border-l-2 border-amber-300 pl-2">
                              Mentor Feedback: &ldquo;{match.mentor_comment}&rdquo;
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {isCleared === true ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Cleared
                            </span>
                          ) : isCleared === false ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 border border-red-200">
                              <XCircle className="h-3.5 w-3.5" />
                              Uncleared
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500 border border-gray-200">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mentor Notes (if any) */}
            {assessment?.mentor_notes && (
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Overall Mentor Notes
                </span>
                <p className="text-xs text-[var(--color-navy)] leading-relaxed">
                  {assessment.mentor_notes}
                </p>
              </div>
            )}

            {/* Live Totals Summary Card */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--color-brand-orange)]" />
                <span className="text-xs font-bold text-[var(--color-navy)]">
                  Assessment Summary
                </span>
              </div>

              <div className="flex items-center gap-4 flex-wrap text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--color-text-muted)] font-medium">Total Dimensions:</span>
                  <span className="font-extrabold text-[var(--color-navy)]">5</span>
                </div>
                <div className="h-4 w-px bg-[var(--color-border-default)]" />
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="font-medium">Cleared:</span>
                  <span className="font-extrabold text-sm">{clearedCount}</span>
                </div>
                <div className="h-4 w-px bg-[var(--color-border-default)]" />
                <div className="flex items-center gap-1.5 text-red-700">
                  <XCircle className="h-3.5 w-3.5" />
                  <span className="font-medium">Uncleared:</span>
                  <span className="font-extrabold text-sm">{unclearedCount}</span>
                </div>
              </div>
            </div>

            {/* Progression Status Explainer Footer */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-900 flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-blue-950">
                  Progression Status: {statusInfo.label}
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  {statusInfo.description} Note that per the DLIF Assessment Rubric, progression
                  into VALIDATE is determined by company shortlisting and finalized by DegreeLabs Team.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
