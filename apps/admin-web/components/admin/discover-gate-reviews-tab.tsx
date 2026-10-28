"use client";

import * as React from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Unlock,
  Lock,
  ChevronRight,
  ShieldCheck,
  Building2,
  User,
  Users2,
  Sparkles,
  ClipboardList,
  RefreshCw,
  X,
  Send,
  HelpCircle,
  Mail,
} from "lucide-react";
import {
  AdminCohort,
  AdminTeam,
  AdminDiscoverGateItem,
  AdminDiscoverGateDimension,
  getAdminDiscoverGates,
  getAdminMentorAssignments,
  recordAdminCompanyDecision,
  requestAdminGateRevision,
  unlockAdminValidate,
  getTeamPhaseProgression,
  TeamPhaseProgression,
} from "@/lib/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/client";

// Canonical DLIF Fellow Handbook (Page 9) rubric
const HANDBOOK_DIMENSIONS = [
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

interface DiscoverGateReviewsTabProps {
  cohorts: AdminCohort[];
  teams: AdminTeam[];
}

export function DiscoverGateReviewsTab({
  cohorts,
  teams,
}: DiscoverGateReviewsTabProps) {
  const [gateItems, setGateItems] = React.useState<AdminDiscoverGateItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [selectedCohortId, setSelectedCohortId] = React.useState<string>("all");
  const [assessmentStatusFilter, setAssessmentStatusFilter] = React.useState<string>("all");
  const [progressionFilter, setProgressionFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Review Modal State
  const [selectedGate, setSelectedGate] = React.useState<AdminDiscoverGateItem | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = React.useState<boolean>(false);
  const [actionNotes, setActionNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [modalSuccess, setModalSuccess] = React.useState<string | null>(null);
  const [modalError, setModalError] = React.useState<string | null>(null);

  // Confirmation Dialog for Unlock VALIDATE
  const [showUnlockConfirm, setShowUnlockConfirm] = React.useState<boolean>(false);

  // Load Data
  const loadData = React.useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [assessments, assignments] = await Promise.all([
        getAdminDiscoverGates(
          selectedCohortId !== "all" ? selectedCohortId : undefined
        ).catch(() => []),
        getAdminMentorAssignments().catch(() => []),
      ]);

      const assignmentMap = new Map<string, string>();
      for (const a of assignments) {
        if (a.team_id && a.mentor_name) {
          assignmentMap.set(a.team_id, a.mentor_name);
        }
      }

      const assessmentMap = new Map<string, any>();
      for (const item of assessments) {
        if (item.team_id) {
          assessmentMap.set(item.team_id, item);
        }
      }

      // Merge teams with submitted gate assessments and mentor assignments
      const mergedItems: AdminDiscoverGateItem[] = await Promise.all(
        teams
          .filter((t) => selectedCohortId === "all" || t.cohort_id === selectedCohortId)
          .map(async (t) => {
            let progStatus: "locked" | "unlocked" = "locked";
            let companyShortlist: "pending" | "shortlisted" | "rejected" = "pending";

            try {
              const progressions = await getTeamPhaseProgression(t.id);
              const valProg = progressions.find((p) => p.phase_code === "VALIDATE");
              if (valProg) {
                if (valProg.status === "unlocked") progStatus = "unlocked";
                if (valProg.decision === "company_shortlisted") companyShortlist = "shortlisted";
                else if (valProg.decision === "rejected") companyShortlist = "rejected";
              }
            } catch {
              // Ignore progression fetch errors
            }

            const cohort = cohorts.find((c) => c.id === t.cohort_id);
            const gate = assessmentMap.get(t.id);
            const mentorName = assignmentMap.get(t.id) || gate?.mentor_name || null;

            if (gate) {
              const status = (gate.status || gate.assessment_status || "submitted") as
                | "not_submitted"
                | "draft"
                | "submitted"
                | "revision_requested";

              return {
                id: gate.id || t.id,
                team_id: t.id,
                team_name: t.name,
                cohort_id: t.cohort_id,
                cohort_name: cohort ? cohort.name : "DLIF Batch",
                mentor_user_id: gate.mentor_user_id || null,
                mentor_name: mentorName,
                company_name: t.company_name,
                company_challenge: t.company_challenge,
                assessment_status: status,
                total_cleared: typeof gate.total_cleared === "number" ? gate.total_cleared : 0,
                total_uncleared: typeof gate.total_uncleared === "number" ? gate.total_uncleared : 0,
                company_shortlisted: companyShortlist,
                phase_progression_status: progStatus,
                submitted_at: gate.submitted_at || null,
                mentor_notes: gate.mentor_notes || null,
                dimensions: gate.dimensions && gate.dimensions.length > 0 ? gate.dimensions : HANDBOOK_DIMENSIONS.map((hd) => ({
                  dimension_key: hd.key,
                  dimension_title: hd.title,
                  sequence: hd.sequence,
                  is_cleared: null,
                  mentor_comment: null,
                })),
              };
            }

            return {
              id: t.id,
              team_id: t.id,
              team_name: t.name,
              cohort_id: t.cohort_id,
              cohort_name: cohort ? cohort.name : "DLIF Batch",
              mentor_user_id: null,
              mentor_name: mentorName,
              company_name: t.company_name,
              company_challenge: t.company_challenge,
              assessment_status: "not_submitted",
              total_cleared: 0,
              total_uncleared: 0,
              company_shortlisted: companyShortlist,
              phase_progression_status: progStatus,
              submitted_at: null,
              mentor_notes: null,
              dimensions: HANDBOOK_DIMENSIONS.map((hd) => ({
                dimension_key: hd.key,
                dimension_title: hd.title,
                sequence: hd.sequence,
                is_cleared: null,
                mentor_comment: null,
              })),
            };
          })
      );

      setGateItems(mergedItems);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load DISCOVER gate reviews."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCohortId, teams, cohorts]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filtered Items
  const filteredItems = React.useMemo(() => {
    return gateItems.filter((item) => {
      if (selectedCohortId !== "all" && item.cohort_id !== selectedCohortId) {
        return false;
      }
      if (assessmentStatusFilter !== "all" && item.assessment_status !== assessmentStatusFilter) {
        return false;
      }
      if (progressionFilter !== "all" && item.phase_progression_status !== progressionFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTeam = item.team_name.toLowerCase().includes(q);
        const matchMentor = item.mentor_name?.toLowerCase().includes(q);
        const matchCompany = item.company_name?.toLowerCase().includes(q);
        if (!matchTeam && !matchMentor && !matchCompany) return false;
      }
      return true;
    });
  }, [gateItems, selectedCohortId, assessmentStatusFilter, progressionFilter, searchQuery]);

  // Handlers
  const handleOpenReview = (item: AdminDiscoverGateItem) => {
    setSelectedGate(item);
    setActionNotes("");
    setModalSuccess(null);
    setModalError(null);
    setShowUnlockConfirm(false);
    setReviewModalOpen(true);
  };

  const handleCompanyDecision = async (decision: "shortlisted" | "rejected") => {
    if (!selectedGate) return;
    setIsSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      await recordAdminCompanyDecision(selectedGate.team_id, decision, actionNotes);
      setModalSuccess(
        `Company decision (${decision === "shortlisted" ? "Shortlisted" : "Rejected"}) recorded successfully.`
      );
      // Update local state
      setSelectedGate((prev) =>
        prev
          ? {
              ...prev,
              company_shortlisted: decision,
            }
          : null
      );
      await loadData(true);
    } catch (err: unknown) {
      setModalError(getErrorMessage(err, "Failed to record company decision."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedGate) return;
    if (!actionNotes.trim()) {
      setModalError("Please provide a revision reason in the notes field.");
      return;
    }
    setIsSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      await requestAdminGateRevision(selectedGate.team_id, actionNotes.trim());
      setModalSuccess("Assessment revision requested from Mentor.");
      setSelectedGate((prev) =>
        prev ? { ...prev, assessment_status: "revision_requested" } : null
      );
      await loadData(true);
    } catch (err: unknown) {
      setModalError(getErrorMessage(err, "Failed to request assessment revision."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlockValidate = async () => {
    if (!selectedGate) return;
    setIsSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      await unlockAdminValidate(selectedGate.team_id, actionNotes.trim());
      setModalSuccess(
        `Phase 2 – VALIDATE unlocked for Team ${selectedGate.team_name}! Congratulations emails have been queued for all eligible team Fellows.`
      );
      setSelectedGate((prev) =>
        prev
          ? {
              ...prev,
              phase_progression_status: "unlocked",
              company_shortlisted: "shortlisted",
            }
          : null
      );
      setShowUnlockConfirm(false);
      await loadData(true);
    } catch (err: unknown) {
      setModalError(getErrorMessage(err, "Failed to unlock VALIDATE phase."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--color-brand-orange)]" />
            <h2 className="text-lg font-bold text-[var(--color-navy)]">
              DISCOVER Gate Reviews & Approvals
            </h2>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-2xl">
            Review Mentor evaluations against the 5 DLIF Handbook dimensions after Session 12,
            record company shortlisting decisions, and authorize Phase 2 – VALIDATE unlocks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData(true)}
          disabled={loading || refreshing}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-white text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition-all disabled:opacity-50 shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[var(--color-brand-orange)]" : ""}`} />
          <span>Refresh Gates</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-[var(--color-bg-surface)] p-4 rounded-2xl border border-[var(--color-border-default)] shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Cohort Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[var(--color-text-muted)] font-medium">Cohort:</span>
            <select
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="rounded-lg border border-[var(--color-border-default)] bg-white px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Cohorts ({cohorts.length})</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[var(--color-text-muted)] font-medium">Assessment:</span>
            <select
              value={assessmentStatusFilter}
              onChange={(e) => setAssessmentStatusFilter(e.target.value)}
              className="rounded-lg border border-[var(--color-border-default)] bg-white px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="draft">Draft</option>
              <option value="not_submitted">Awaiting Mentor</option>
              <option value="revision_requested">Revision Requested</option>
            </select>
          </div>

          {/* Phase Progression Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[var(--color-text-muted)] font-medium">VALIDATE:</span>
            <select
              value={progressionFilter}
              onChange={(e) => setProgressionFilter(e.target.value)}
              className="rounded-lg border border-[var(--color-border-default)] bg-white px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="unlocked">Unlocked</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team, mentor, company..."
            className="w-full rounded-lg border border-[var(--color-border-default)] bg-white pl-8 pr-3 py-1.5 text-xs text-[var(--color-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Gate Reviews Table */}
      <div className="rounded-2xl border border-[var(--color-border-default)] bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-xs text-[var(--color-text-muted)]">
            <RefreshCw className="h-5 w-5 animate-spin text-[var(--color-brand-orange)]" />
            <span>Loading gate reviews...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ClipboardList className="h-8 w-8 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-[var(--color-navy)]">No Teams Found</h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              No phase gate records match the active filters or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border-default)] bg-gray-50/70 text-[var(--color-navy)] font-bold">
                  <th scope="col" className="px-4 py-3">
                    Team & Cohort
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Assigned Mentor
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Assessment Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Cleared / Uncleared
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Company Shortlist
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    VALIDATE Access
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-default)]">
                {filteredItems.map((item) => (
                  <tr key={item.team_id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Team & Cohort */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[var(--color-navy)] block">
                          {item.team_name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                          <span>{item.cohort_name || "Cohort"}</span>
                          {item.company_name && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Building2 className="h-3 w-3 text-gray-400" />
                                {item.company_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Assigned Mentor */}
                    <td className="px-4 py-3.5 text-[var(--color-text-secondary)]">
                      {item.mentor_name ? (
                        <span className="font-medium text-[var(--color-navy)] flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          {item.mentor_name}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Not Assigned</span>
                      )}
                    </td>

                    {/* Assessment Status */}
                    <td className="px-4 py-3.5 text-center">
                      {item.assessment_status === "submitted" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Submitted
                        </span>
                      ) : item.assessment_status === "draft" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                          <Clock className="h-3 w-3" /> Draft
                        </span>
                      ) : item.assessment_status === "revision_requested" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200">
                          <AlertCircle className="h-3 w-3" /> Revision Req.
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500 border border-gray-200">
                          Awaiting Mentor
                        </span>
                      )}
                    </td>

                    {/* Cleared / Uncleared Count */}
                    <td className="px-4 py-3.5 text-center">
                      {item.assessment_status === "submitted" ? (
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                            <CheckCircle2 className="h-3 w-3" />
                            {item.total_cleared}
                          </span>
                          <span className="text-gray-300">/</span>
                          <span className="inline-flex items-center gap-0.5 text-red-600 font-bold">
                            <XCircle className="h-3 w-3" />
                            {item.total_uncleared}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400">—</span>
                      )}
                    </td>

                    {/* Company Shortlist */}
                    <td className="px-4 py-3.5 text-center">
                      {item.company_shortlisted === "shortlisted" || item.company_shortlisted === true ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                          <Sparkles className="h-3 w-3 text-amber-500" /> Shortlisted
                        </span>
                      ) : item.company_shortlisted === "rejected" || item.company_shortlisted === false ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                          <XCircle className="h-3 w-3" /> Not Shortlisted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500 border border-gray-200">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* VALIDATE Access */}
                    <td className="px-4 py-3.5 text-center">
                      {item.phase_progression_status === "unlocked" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <Unlock className="h-3 w-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 border border-gray-200">
                          <Lock className="h-3 w-3 text-gray-400" /> Locked
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenReview(item)}
                        className="gap-1 text-xs"
                      >
                        Review
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Approval Modal */}
      {reviewModalOpen && selectedGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-xs sm:p-4 animate-in fade-in">
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-2xl sm:max-h-[90vh] sm:p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[var(--color-border-default)] pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-orange)]">
                    DISCOVER Gate Review
                  </span>
                  <Badge
                    variant={selectedGate.phase_progression_status === "unlocked" ? "success" : "muted"}
                    size="sm"
                  >
                    {selectedGate.phase_progression_status === "unlocked" ? "VALIDATE Unlocked" : "VALIDATE Locked"}
                  </Badge>
                </div>
                <h2 className="text-lg font-extrabold text-[var(--color-navy)] mt-1">
                  Team {selectedGate.team_name} – Phase Gate Assessment
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-text-muted)] flex-wrap">
                  <span>{selectedGate.cohort_name || "DLIF Batch"}</span>
                  {selectedGate.company_name && (
                    <>
                      <span>•</span>
                      <span>Company: {selectedGate.company_name}</span>
                    </>
                  )}
                  {selectedGate.mentor_name && (
                    <>
                      <span>•</span>
                      <span>Mentor: {selectedGate.mentor_name}</span>
                    </>
                  )}
                  {selectedGate.submitted_at && (
                    <>
                      <span>•</span>
                      <span>
                        Submitted: {new Date(selectedGate.submitted_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Alerts */}
            {modalError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}
            {modalSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {/* Assessment Dimensions Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[var(--color-navy)] uppercase tracking-wider">
                  Handbook Assessment Dimensions (Page 9)
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Cleared: {selectedGate.total_cleared}
                  </span>
                  <span className="font-semibold text-red-700 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" />
                    Uncleared: {selectedGate.total_uncleared}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[var(--color-border-default)]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[var(--color-border-default)] font-bold text-[var(--color-navy)]">
                      <th className="px-3 py-2.5 w-10 text-center">#</th>
                      <th className="px-3 py-2.5 w-48">Dimension</th>
                      <th className="px-3 py-2.5">Observable Evidence</th>
                      <th className="px-3 py-2.5 w-28 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-default)]">
                    {HANDBOOK_DIMENSIONS.map((hd, idx) => {
                      const match = (selectedGate.dimensions || []).find(
                        (d) => d.dimension_key === hd.key || d.sequence === hd.sequence
                      );
                      const isCleared = match?.is_cleared;

                      return (
                        <tr
                          key={hd.key}
                          className={
                            isCleared === true
                              ? "bg-emerald-50/20"
                              : isCleared === false
                              ? "bg-red-50/20"
                              : ""
                          }
                        >
                          <td className="px-3 py-2.5 text-center text-gray-400 font-bold">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-[var(--color-navy)]">
                            {hd.title}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--color-text-secondary)] leading-relaxed">
                            {hd.observableEvidence}
                            {match?.mentor_comment && (
                              <p className="mt-1 text-[11px] italic text-gray-500 border-l-2 border-gray-300 pl-2">
                                Mentor Comment: &ldquo;{match.mentor_comment}&rdquo;
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {isCleared === true ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3" /> Cleared
                              </span>
                            ) : isCleared === false ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                                <XCircle className="h-3 w-3" /> Uncleared
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[11px]">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mentor Notes */}
            {selectedGate.mentor_notes && (
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Overall Mentor Notes
                </span>
                <p className="text-xs text-[var(--color-navy)] leading-relaxed">
                  {selectedGate.mentor_notes}
                </p>
              </div>
            )}

            {/* Company Shortlisting & Decision Controls */}
            <div className="rounded-xl border border-[var(--color-border-default)] bg-gray-50/50 p-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[var(--color-navy)] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[var(--color-brand-orange)]" />
                  Step 1: Company Shortlisting Status
                </h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Per the DLIF Handbook, entry into VALIDATE requires company shortlisting. Record
                  the company’s decision below before authorizing progression.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCompanyDecision("shortlisted")}
                  disabled={isSubmitting}
                  className={`gap-1.5 text-xs ${
                    selectedGate.company_shortlisted === "shortlisted" ||
                    selectedGate.company_shortlisted === true
                      ? "bg-blue-50 text-blue-700 border-blue-300 font-bold"
                      : ""
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Mark Company Shortlisted
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCompanyDecision("rejected")}
                  disabled={isSubmitting}
                  className={`gap-1.5 text-xs ${
                    selectedGate.company_shortlisted === "rejected" ||
                    selectedGate.company_shortlisted === false
                      ? "bg-red-50 text-red-700 border-red-300 font-bold"
                      : ""
                  }`}
                >
                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                  Mark Not Shortlisted
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleRequestRevision}
                  disabled={isSubmitting}
                  className="gap-1.5 text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  Request Mentor Revision
                </Button>
              </div>

              {/* Action Notes */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Administrative Notes / Revision Rationale
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Add administrative decision rationale or instructions for revision..."
                  rows={2}
                  className="w-full rounded-lg border border-[var(--color-border-default)] bg-white px-3 py-2 text-xs text-[var(--color-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Step 2: Final Progression & Phase Unlock */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Unlock className="h-4 w-4 text-blue-700" />
                    Step 2: Unlock Phase 2 – VALIDATE
                  </h4>
                  <p className="text-xs text-blue-800 mt-0.5 max-w-xl">
                    Unlocking VALIDATE grants immediate portal access to all eligible Fellows in
                    Team {selectedGate.team_name} and dispatches their congratulations emails.
                  </p>
                </div>

                <div>
                  {selectedGate.phase_progression_status === "unlocked" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      VALIDATE Already Unlocked
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setShowUnlockConfirm(true)}
                      disabled={isSubmitting}
                      className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2"
                    >
                      <Unlock className="h-4 w-4" />
                      Unlock Phase 2 – VALIDATE
                    </Button>
                  )}
                </div>
              </div>

              {/* Confirmation Dialog within Modal */}
              {showUnlockConfirm && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-amber-900">
                        Confirm Progression to VALIDATE
                      </p>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Are you sure you want to unlock VALIDATE for this team? All eligible Fellows
                        in this team will gain access to Phase 2 and receive a congratulations email.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowUnlockConfirm(false)}
                      disabled={isSubmitting}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleUnlockValidate}
                      disabled={isSubmitting}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isSubmitting ? "Unlocking..." : "Yes, Unlock VALIDATE"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
