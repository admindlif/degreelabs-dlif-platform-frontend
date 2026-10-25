"use client";

import * as React from "react";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  Lock,
  RefreshCw,
  Sparkles,
  Unlock,
  X,
} from "lucide-react";

import {
  AdminTeam,
  TeamPhaseProgression,
  TeamPhaseProgressionUpdate,
  getTeamPhaseProgression,
  updateTeamPhaseProgression,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FellowshipPhaseAccessControlProps {
  team: AdminTeam;
  onChanged?: () => Promise<void> | void;
}

interface ActionModalConfig {
  phaseCode: "VALIDATE" | "GROW";
  phaseName: string;
  actionType: "unlock" | "lock";
  title: string;
  description: string;
  targetStatus: "unlocked" | "locked";
  decision: "company_shortlisted" | "paid_implementation_approved" | "rejected";
  confirmButtonText: string;
  confirmVariant: "primary" | "danger";
  defaultNotesPlaceholder: string;
}

export function FellowshipPhaseAccessControl({
  team,
  onChanged,
}: FellowshipPhaseAccessControlProps) {
  const [progression, setProgression] = React.useState<TeamPhaseProgression[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Confirmation dialog state
  const [activeModal, setActiveModal] = React.useState<ActionModalConfig | null>(null);
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await getTeamPhaseProgression(team.id);
      setProgression(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Unable to load team phase progression data.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [team.id]);

  React.useEffect(() => {
    let cancelled = false;

    getTeamPhaseProgression(team.id)
      .then((data) => {
        if (!cancelled) {
          setProgression(Array.isArray(data) ? data : []);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            getErrorMessage(err, "Unable to load team phase progression data.")
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [team.id]);

  // Find records for VALIDATE and GROW
  const validateRecord = progression.find(
    (p) => p.phase_code?.toUpperCase() === "VALIDATE"
  );
  const growRecord = progression.find(
    (p) => p.phase_code?.toUpperCase() === "GROW"
  );

  const isValidateUnlocked =
    validateRecord?.status?.toLowerCase() === "unlocked";
  const isGrowUnlocked = growRecord?.status?.toLowerCase() === "unlocked";

  // Open confirmation modal
  const handleOpenModal = (config: ActionModalConfig) => {
    setActiveModal(config);
    setNotes("");
    setModalError(null);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setActiveModal(null);
    setNotes("");
    setModalError(null);
  };

  // Execute unlock / lock update
  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    setSubmitting(true);
    setModalError(null);

    const payload: TeamPhaseProgressionUpdate = {
      phase_code: activeModal.phaseCode,
      status: activeModal.targetStatus,
      decision: activeModal.decision,
      notes: notes.trim() || undefined,
    };

    try {
      await updateTeamPhaseProgression(team.id, payload);

      setSuccessMessage(
        `${activeModal.phaseName} access successfully ${
          activeModal.targetStatus === "unlocked" ? "unlocked" : "locked / revoked"
        } for Team ${team.name}.`
      );

      // Invalidate and refetch immediately
      await loadData(true);
      if (onChanged) {
        await onChanged();
      }

      handleCloseModal();

      // Clear success banner after 6 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 6000);
    } catch (err: unknown) {
      setModalError(
        getErrorMessage(
          err,
          `Failed to ${activeModal.actionType === "unlock" ? "unlock" : "lock"} ${activeModal.phaseName}.`
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-brand-orange)]" />
            <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
              Fellowship Phase Access Control
            </h3>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Manage phase unlocking, company shortlist decisions, and paid implementation advancement for Team {team.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData(true)}
          disabled={loading || refreshing}
          aria-label="Refresh phase access status"
          title="Refresh phase access status"
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              refreshing ? "animate-spin text-[var(--color-brand-orange)]" : ""
            }`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Global error message */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Success banner */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-green-700 hover:text-green-900 text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-brand-orange)]" />
          <span>Loading phase progression details...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* ================================================================= */}
          {/* PHASE 01: DISCOVER (Standard Phase) */}
          {/* ================================================================= */}
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 sm:p-5 transition-shadow hover:shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[var(--color-brand-orange)] tracking-wider uppercase">
                      Phase 01
                    </span>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                      DISCOVER (THINK)
                    </h4>
                    <Badge variant="success" size="sm">
                      Unlocked
                    </Badge>
                    <span className="text-[10px] font-semibold text-[var(--color-text-muted)] bg-[var(--color-bg-subtle)] px-2 py-0.5 rounded-md">
                      Standard Phase
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    4-week strategic problem discovery & apprentice sprint. Accessible by default to all enrolled fellows upon cohort onboarding.
                  </p>
                </div>
              </div>

              <div className="self-end sm:self-auto shrink-0">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Always Active
                </span>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* PHASE 02: VALIDATE (Company Shortlist) */}
          {/* ================================================================= */}
          <div
            className={`rounded-xl border p-4 sm:p-5 transition-all ${
              isValidateUnlocked
                ? "border-emerald-200 bg-emerald-50/20"
                : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)]"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    isValidateUnlocked
                      ? "bg-blue-50 border-blue-200 text-[var(--color-brand-blue)]"
                      : "bg-[var(--color-bg-subtle)] border-[var(--color-border-default)] text-[var(--color-text-muted)]"
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[var(--color-brand-orange)] tracking-wider uppercase">
                      Phase 02
                    </span>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                      VALIDATE (PROVE)
                    </h4>
                    {isValidateUnlocked ? (
                      <Badge variant="success" size="sm">
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="muted" size="sm">
                        Locked
                      </Badge>
                    )}

                    {validateRecord?.decision === "company_shortlisted" && (
                      <Badge variant="brand" size="sm">
                        Company Shortlisted
                      </Badge>
                    )}
                    {validateRecord?.decision === "rejected" && (
                      <Badge variant="outline" size="sm">
                        Access Revoked
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-[var(--color-text-muted)]">
                    4-week solution validation sprint. Unlocks when the team secures company partner shortlisting endorsement.
                  </p>

                  {/* Decision metadata if available */}
                  {(validateRecord?.decided_at || validateRecord?.notes) && (
                    <div className="mt-2 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)] p-2.5 text-[11px] space-y-1">
                      {validateRecord.decided_at && (
                        <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>Last updated {formatDate(validateRecord.decided_at)}</span>
                        </div>
                      )}
                      {validateRecord.notes && (
                        <div className="text-[var(--color-text-body)]">
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            Notes:
                          </span>{" "}
                          {validateRecord.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for VALIDATE */}
              <div className="self-end sm:self-center shrink-0">
                {!isValidateUnlocked ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      handleOpenModal({
                        phaseCode: "VALIDATE",
                        phaseName: "VALIDATE (Phase 02)",
                        actionType: "unlock",
                        title: `Shortlist Team ${team.name} for VALIDATE`,
                        description:
                          "This unlocks Phase 02: VALIDATE for all members of this team. Fellows will be able to access the VALIDATE sprint dashboard, company challenge data, and validation roadmap.",
                        targetStatus: "unlocked",
                        decision: "company_shortlisted",
                        confirmButtonText: "Confirm Shortlist & Unlock",
                        confirmVariant: "primary",
                        defaultNotesPlaceholder:
                          "e.g. Shortlisted based on company review of Discover deliverables and solution diagnosis.",
                      })
                    }
                    className="gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Shortlist for VALIDATE</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      handleOpenModal({
                        phaseCode: "VALIDATE",
                        phaseName: "VALIDATE (Phase 02)",
                        actionType: "lock",
                        title: `Revoke VALIDATE Access for Team ${team.name}`,
                        description:
                          "This will lock Phase 02: VALIDATE for this team. Fellows will no longer be able to access VALIDATE phase content or submit phase outputs.",
                        targetStatus: "locked",
                        decision: "rejected",
                        confirmButtonText: "Confirm Lock / Revoke",
                        confirmVariant: "danger",
                        defaultNotesPlaceholder:
                          "e.g. Access revoked due to revised company selection or review outcome.",
                      })
                    }
                    className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock / Revoke Access</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* PHASE 03: GROW (Paid Implementation) */}
          {/* ================================================================= */}
          <div
            className={`rounded-xl border p-4 sm:p-5 transition-all ${
              isGrowUnlocked
                ? "border-emerald-200 bg-emerald-50/20"
                : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)]"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    isGrowUnlocked
                      ? "bg-amber-50 border-amber-200 text-amber-600"
                      : "bg-[var(--color-bg-subtle)] border-[var(--color-border-default)] text-[var(--color-text-muted)]"
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[var(--color-brand-orange)] tracking-wider uppercase">
                      Phase 03
                    </span>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                      GROW (DELIVER)
                    </h4>
                    {isGrowUnlocked ? (
                      <Badge variant="success" size="sm">
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="muted" size="sm">
                        Locked
                      </Badge>
                    )}

                    {growRecord?.decision === "paid_implementation_approved" && (
                      <Badge variant="brand" size="sm">
                        Paid Implementation Approved
                      </Badge>
                    )}
                    {growRecord?.decision === "rejected" && (
                      <Badge variant="outline" size="sm">
                        Access Revoked
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-[var(--color-text-muted)]">
                    3–6 month delivery term. Unlocks upon enterprise sponsor endorsement and approved paid client implementation.
                  </p>

                  {/* Decision metadata if available */}
                  {(growRecord?.decided_at || growRecord?.notes) && (
                    <div className="mt-2 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)] p-2.5 text-[11px] space-y-1">
                      {growRecord.decided_at && (
                        <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>Last updated {formatDate(growRecord.decided_at)}</span>
                        </div>
                      )}
                      {growRecord.notes && (
                        <div className="text-[var(--color-text-body)]">
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            Notes:
                          </span>{" "}
                          {growRecord.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for GROW */}
              <div className="self-end sm:self-center shrink-0">
                {!isGrowUnlocked ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      handleOpenModal({
                        phaseCode: "GROW",
                        phaseName: "GROW (Phase 03)",
                        actionType: "unlock",
                        title: `Approve Paid Implementation for GROW — Team ${team.name}`,
                        description:
                          "This unlocks Phase 03: GROW for this team based on confirmed enterprise endorsement and paid client implementation agreement.",
                        targetStatus: "unlocked",
                        decision: "paid_implementation_approved",
                        confirmButtonText: "Approve Paid Implementation for GROW",
                        confirmVariant: "primary",
                        defaultNotesPlaceholder:
                          "e.g. Enterprise partner pilot agreement executed for 3-month delivery sprint.",
                      })
                    }
                    className="gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Approve Paid Implementation for GROW</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      handleOpenModal({
                        phaseCode: "GROW",
                        phaseName: "GROW (Phase 03)",
                        actionType: "lock",
                        title: `Revoke GROW Access for Team ${team.name}`,
                        description:
                          "This will lock Phase 03: GROW for this team. Fellows will no longer be able to access the GROW phase.",
                        targetStatus: "locked",
                        decision: "rejected",
                        confirmButtonText: "Confirm Lock / Revoke",
                        confirmVariant: "danger",
                        defaultNotesPlaceholder:
                          "e.g. Implementation completed or access paused by administrator.",
                      })
                    }
                    className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock / Revoke Access</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ACTION CONFIRMATION MODAL WITH NOTES */}
      {/* ===================================================================== */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="phase-progression-modal-title"
            className="w-full max-w-lg rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeModal.actionType === "unlock"
                      ? "bg-orange-50 text-[var(--color-brand-orange)]"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {activeModal.actionType === "unlock" ? (
                    <Unlock className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3
                    id="phase-progression-modal-title"
                    className="text-base font-extrabold text-[var(--color-text-primary)]"
                  >
                    {activeModal.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Team {team.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                aria-label="Close dialog"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Error */}
            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Description */}
            <p className="text-xs text-[var(--color-text-body)] leading-relaxed">
              {activeModal.description}
            </p>

            {/* Form */}
            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label
                  htmlFor="phase-decision-notes"
                  className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5"
                >
                  Decision Notes & Justification (Optional)
                </label>
                <textarea
                  id="phase-decision-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={activeModal.defaultNotesPlaceholder}
                  disabled={submitting}
                  className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-3 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]"
                />
                <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
                  These notes will be recorded with the admin progression decision.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border-default)]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={activeModal.confirmVariant}
                  size="sm"
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>
                    {submitting ? "Saving..." : activeModal.confirmButtonText}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
