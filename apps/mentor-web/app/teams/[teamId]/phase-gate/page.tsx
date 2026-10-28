"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Send,
  Save,
  ClipboardList,
  Info,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  getMentorPhaseGate,
  saveMentorPhaseGateDraft,
  submitMentorPhaseGate,
  getMentorTeam,
} from "@/lib/api/mentor";
import type {
  PhaseGateAssessment,
  RubricDimension,
  MentorTeamSummary,
} from "@/lib/api/types";
import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Canonical DLIF Fellow Handbook – DISCOVER v1.0 FINAL (Page 9) rubric
const HANDBOOK_RUBRIC: (RubricDimension & { dimension_key: string; dimension_title: string })[] = [
  {
    key: "business_understanding",
    dimension_key: "business_understanding",
    title: "Business Understanding",
    dimension_title: "Business Understanding",
    sequence: 1,
    description:
      "Accurate context, relevant workflow, stakeholder understanding, constraints and economics/value logic.",
  },
  {
    key: "evidence_problem_framing",
    dimension_key: "evidence_problem_framing",
    title: "Evidence & Problem Framing",
    dimension_title: "Evidence & Problem Framing",
    sequence: 2,
    description:
      "Source quality, distinction between evidence and assumptions, diagnosis quality, bounded problem and measurable outcome.",
  },
  {
    key: "strategic_choice",
    dimension_key: "strategic_choice",
    title: "Strategic Choice",
    dimension_title: "Strategic Choice",
    sequence: 3,
    description:
      "Quality of alternatives, WWHTBT logic, barrier testing, decision rationale and willingness to revise.",
  },
  {
    key: "execution_thinking",
    dimension_key: "execution_thinking",
    title: "Execution Thinking",
    dimension_title: "Execution Thinking",
    sequence: 4,
    description:
      "Internal coherence, operational credibility, dependencies, risks and success measures.",
  },
  {
    key: "professional_communication",
    dimension_key: "professional_communication",
    title: "Professional Communication",
    dimension_title: "Professional Communication",
    sequence: 5,
    description:
      "Clarity, prioritisation, evidence integrity, response to challenge and company usability.",
  },
];

function getDimKey(dim: RubricDimension | any, idx: number): string {
  return dim.dimension_key || dim.key || `dimension_${idx + 1}`;
}

function getDimTitle(dim: RubricDimension | any, idx: number): string {
  return dim.dimension_title || dim.title || `Dimension ${idx + 1}`;
}

const initialDecisions: Record<string, { is_cleared: boolean | null; mentor_comment: string }> = {
  business_understanding: { is_cleared: null, mentor_comment: "" },
  evidence_problem_framing: { is_cleared: null, mentor_comment: "" },
  strategic_choice: { is_cleared: null, mentor_comment: "" },
  execution_thinking: { is_cleared: null, mentor_comment: "" },
  professional_communication: { is_cleared: null, mentor_comment: "" },
};

export default function PhaseGatePage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId ?? "";
  const router = useRouter();

  const [team, setTeam] = React.useState<MentorTeamSummary | null>(null);
  const [assessment, setAssessment] = React.useState<PhaseGateAssessment | null>(null);
  const [rubric, setRubric] = React.useState<RubricDimension[]>(HANDBOOK_RUBRIC);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [mentorNotes, setMentorNotes] = React.useState<string>("");
  const [decisions, setDecisions] = React.useState<
    Record<string, { is_cleared: boolean | null; mentor_comment: string }>
  >(initialDecisions);

  React.useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    setError(null);

    Promise.allSettled([getMentorTeam(teamId), getMentorPhaseGate(teamId)])
      .then(([teamRes, gateRes]) => {
        if (teamRes.status === "fulfilled") {
          setTeam(teamRes.value);
        }

        if (gateRes.status === "fulfilled") {
          const data = gateRes.value;
          setAssessment(data);
          if (data.rubric && Array.isArray(data.rubric) && data.rubric.length > 0) {
            const normalized = data.rubric.map((r: any, idx: number) => ({
              key: r.dimension_key || r.key || `dimension_${idx + 1}`,
              dimension_key: r.dimension_key || r.key || `dimension_${idx + 1}`,
              title: r.dimension_title || r.title || `Dimension ${idx + 1}`,
              dimension_title: r.dimension_title || r.title || `Dimension ${idx + 1}`,
              sequence: r.sequence ?? idx + 1,
              description: r.description || "",
            }));
            setRubric(normalized);
          } else {
            setRubric(HANDBOOK_RUBRIC);
          }
          setMentorNotes(typeof data.mentor_notes === "string" ? data.mentor_notes : "");

          const init: Record<string, { is_cleared: boolean | null; mentor_comment: string }> = {
            ...initialDecisions,
          };
          if (data.dimensions && Array.isArray(data.dimensions) && data.dimensions.length > 0) {
            for (const dim of data.dimensions) {
              const k = dim.dimension_key || (dim as any).key;
              if (k) {
                init[k] = {
                  is_cleared: typeof dim.is_cleared === "boolean" ? dim.is_cleared : null,
                  mentor_comment: typeof dim.mentor_comment === "string" ? dim.mentor_comment : "",
                };
              }
            }
          }
          setDecisions(init);
        } else {
          // If no draft exists yet or request returned 404, gracefully initialize with handbook rubric
          setDecisions({ ...initialDecisions });
        }
      })
      .catch((e) => {
        console.warn("Could not load initial assessment:", e);
      })
      .finally(() => setLoading(false));
  }, [teamId]);

  const buildPayload = () => ({
    dimensions: Object.entries(decisions)
      .filter(([key]) => Boolean(key) && key !== "undefined")
      .map(([key, val]) => ({
        dimension_key: key,
        is_cleared: val.is_cleared,
        mentor_comment: val.mentor_comment ? val.mentor_comment.trim() : null,
      })),
    mentor_notes: mentorNotes ? mentorNotes.trim() : null,
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await saveMentorPhaseGateDraft(teamId, buildPayload());
      setAssessment(updated);
      setSuccessMsg("Draft assessment saved successfully.");
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !window.confirm(
        "Submit this assessment? Once submitted, the assessment will be visible to Fellows and Admin for progression decision."
      )
    )
      return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await submitMentorPhaseGate(teamId, buildPayload());
      setAssessment(updated);
      setSuccessMsg(
        "Assessment successfully submitted! The Admin team will review your evaluation and make the final progression decision to unlock VALIDATE."
      );
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to submit assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitted = assessment?.status === "submitted";

  // Calculate live totals across the 5 handbook dimensions
  const total = 5;
  const cleared = Object.values(decisions).filter((d) => d.is_cleared === true).length;
  const uncleared = Object.values(decisions).filter((d) => d.is_cleared === false).length;
  const notAssessed = total - cleared - uncleared;
  const allDecided = notAssessed === 0;

  return (
    <PortalShell
      breadcrumbItems={["My Teams", team ? team.name : "Team", "DISCOVER Gate Assessment"]}
    >
      <div className="space-y-6 max-w-5xl">
        {/* Back navigation */}
        <div>
          <button
            type="button"
            onClick={() => router.push(`/teams/${teamId}`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Team Details
          </button>
        </div>

        {/* Hero Card */}
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-gradient-to-br from-[var(--color-brand-navy,#0f172a)] to-[#1e293b] p-6 text-white shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/90 border border-white/20">
                  <ClipboardList className="h-3.5 w-3.5 text-[var(--color-brand-orange)]" />
                  Phase Gate Assessment
                </span>
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-blue-200 border border-blue-400/30">
                  Phase 1: DISCOVER
                </span>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200 border border-amber-400/30">
                  Session 12: Final DISCOVER Review
                </span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                DISCOVER – Final Gate Assessment
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
                Review the team’s work across DISCOVER and assess each dimension using the observable
                evidence. Mark every dimension as Cleared
                or Uncleared based on the evidence demonstrated by the team.
              </p>
            </div>

            <div className="shrink-0 flex sm:flex-col items-start sm:items-end gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold border ${isSubmitted
                  ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                  : "bg-amber-500/20 text-amber-200 border-amber-400/30"
                  }`}
              >
                {isSubmitted ? "✓ Submitted" : "Draft (In Progress)"}
              </span>
              {team && (
                <span className="text-xs text-gray-300 font-semibold flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-[var(--color-brand-orange)]" />
                  {team.name}
                </span>
              )}
            </div>
          </div>

          {/* Context Details */}
          {team && (
            <div className="pt-3 border-t border-white/10 flex flex-wrap gap-4 text-xs text-gray-300">
              <div>
                <span className="text-gray-400 font-medium">Cohort / Batch:</span>{" "}
                <span className="font-semibold text-white">{team.cohort?.name || "DLIF Batch"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Team:</span>{" "}
                <span className="font-semibold text-white">{team.name}</span>
              </div>
              {team.company_name && (
                <div>
                  <span className="text-gray-400 font-medium">Company:</span>{" "}
                  <span className="font-semibold text-white">{team.company_name}</span>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Live Assessment Summary Counters */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white/10 p-3 text-center border border-white/10">
              <span className="text-[11px] text-gray-300 block font-medium">Total Dimensions</span>
              <span className="text-xl font-extrabold text-white mt-0.5 block">{total}</span>
            </div>
            <div className="rounded-xl bg-emerald-500/20 p-3 text-center border border-emerald-400/30">
              <span className="text-[11px] text-emerald-200 block font-medium">Cleared</span>
              <span className="text-xl font-extrabold text-emerald-300 mt-0.5 block">{cleared}</span>
            </div>
            <div className="rounded-xl bg-red-500/20 p-3 text-center border border-red-400/30">
              <span className="text-[11px] text-red-200 block font-medium">Uncleared</span>
              <span className="text-xl font-extrabold text-red-300 mt-0.5 block">{uncleared}</span>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-center border border-white/10">
              <span className="text-[11px] text-gray-300 block font-medium">Not Assessed</span>
              <span className="text-xl font-extrabold text-white mt-0.5 block">{notAssessed}</span>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-medium">{successMsg}</p>
          </div>
        )}

        {isSubmitted && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              This assessment has been <strong>submitted</strong> and is read-only. The Admin team
              will review your evaluation and company shortlisting before unlocking VALIDATE for the team.
            </p>
          </div>
        )}

        {/* Assessment Table & Criteria */}
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-white shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[var(--color-border-default)] bg-gray-50/70">
            <h2 className="text-sm font-bold text-[var(--color-navy)] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--color-brand-orange)]" />
              DLIF Assessment Rubric
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Select Cleared or Uncleared for each of the five dimensions. Both options are mutually exclusive.
            </p>
          </div>

          <div className="divide-y divide-[var(--color-border-default)]">
            {rubric.map((item, idx) => {
              const dimKey = getDimKey(item, idx);
              const dimTitle = getDimTitle(item, idx);
              const current = decisions[dimKey] ?? {
                is_cleared: null,
                mentor_comment: "",
              };

              return (
                <div
                  key={dimKey}
                  className={`p-5 transition-colors ${current.is_cleared === true
                    ? "bg-emerald-50/25"
                    : current.is_cleared === false
                      ? "bg-red-50/20"
                      : "hover:bg-gray-50/50"
                    }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-[10px] font-bold text-white">
                          {idx + 1}
                        </span>
                        <h3 className="text-xs font-bold text-[var(--color-navy)]">
                          {dimTitle}
                        </h3>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed pl-7">
                        {item.description}
                      </p>
                    </div>

                    {/* Interactive Selection Controls */}
                    <div className="md:shrink-0 flex items-center gap-2 pl-7 md:pl-0 flex-wrap">
                      {!isSubmitted ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setDecisions((prev) => {
                                const existing = prev[dimKey] ?? {
                                  is_cleared: null,
                                  mentor_comment: "",
                                };
                                return {
                                  ...prev,
                                  [dimKey]: {
                                    ...existing,
                                    is_cleared: true,
                                  },
                                };
                              })
                            }
                            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold border transition-all ${current.is_cleared === true
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-white text-gray-700 border-gray-300 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/40"
                              }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Cleared
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDecisions((prev) => {
                                const existing = prev[dimKey] ?? {
                                  is_cleared: null,
                                  mentor_comment: "",
                                };
                                return {
                                  ...prev,
                                  [dimKey]: {
                                    ...existing,
                                    is_cleared: false,
                                  },
                                };
                              })
                            }
                            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold border transition-all ${current.is_cleared === false
                              ? "bg-red-600 text-white border-red-600 shadow-xs"
                              : "bg-white text-gray-700 border-gray-300 hover:border-red-500 hover:text-red-700 hover:bg-red-50/40"
                              }`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Uncleared
                          </button>
                        </>
                      ) : (
                        <div className="text-xs font-bold">
                          {current.is_cleared === true ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Cleared
                            </span>
                          ) : current.is_cleared === false ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-red-700 border border-red-200">
                              <XCircle className="h-3.5 w-3.5" /> Uncleared
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-gray-500 border border-gray-200">
                              Not Assessed
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mentor Dimension Feedback */}
                  {!isSubmitted ? (
                    <div className="mt-3 pl-7">
                      <input
                        type="text"
                        value={current.mentor_comment || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDecisions((prev) => {
                            const existing = prev[dimKey] ?? {
                              is_cleared: null,
                              mentor_comment: "",
                            };
                            return {
                              ...prev,
                              [dimKey]: {
                                ...existing,
                                mentor_comment: val,
                              },
                            };
                          });
                        }}
                        placeholder="Specific feedback or observable notes for this dimension (optional)..."
                        className="w-full rounded-lg border border-[var(--color-border-default)] bg-gray-50/50 px-3 py-1.5 text-xs text-[var(--color-text-primary)] placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                  ) : (
                    current.mentor_comment && (
                      <p className="mt-2 text-xs italic text-[var(--color-text-secondary)] pl-7 border-l-2 border-gray-300 ml-7">
                        &ldquo;{current.mentor_comment}&rdquo;
                      </p>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Mentor Notes */}
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-xs space-y-2">
          <label className="block text-xs font-bold text-[var(--color-navy)]">
            Overall Mentor Notes & Observations{" "}
            <span className="text-[var(--color-text-muted)] font-normal">(optional)</span>
          </label>
          {!isSubmitted ? (
            <textarea
              value={mentorNotes || ""}
              onChange={(e) => setMentorNotes(e.target.value)}
              placeholder="Summarize the team’s overall DISCOVER journey, problem clarity, and key strengths or areas for validation..."
              rows={3}
              className="w-full resize-none rounded-xl border border-[var(--color-border-default)] bg-gray-50/50 px-3 py-2 text-xs text-[var(--color-text-primary)] placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          ) : (
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed bg-gray-50 p-3 rounded-lg">
              {mentorNotes || "No additional notes provided."}
            </p>
          )}
        </div>

        {/* Action Controls */}
        {!isSubmitted && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div>
              {!allDecided ? (
                <p className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  All 5 dimensions must be assessed (Cleared or Uncleared) before submitting.
                  ({notAssessed} pending)
                </p>
              ) : (
                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <Check className="h-4 w-4 shrink-0" />
                  All 5 dimensions assessed. Ready for submission.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSaveDraft}
                disabled={saving || submitting}
                className="gap-1.5 text-xs"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving Draft..." : "Save Draft"}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={saving || submitting || !allDecided}
                className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? "Submitting..." : "Submit Assessment"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
