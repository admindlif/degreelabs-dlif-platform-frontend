"use client";

import * as React from "react";
import {
  AdminChecklistItem,
  AdminCohort,
  AdminPhase,
  AdminSession,
  AdminWeek,
  createChecklistItem,
  updateChecklistItem,
} from "@/lib/api/admin";

interface ChecklistItemModalProps {
  item?: AdminChecklistItem | null;
  cohorts: AdminCohort[];
  phases: AdminPhase[];
  weeks: AdminWeek[];
  sessions: AdminSession[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

function toLocalDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const fieldClass =
  "w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2.5 text-sm";

export function ChecklistItemModal({
  item,
  cohorts,
  phases,
  weeks,
  sessions,
  onClose,
  onSaved,
}: ChecklistItemModalProps) {
  const [cohortId, setCohortId] = React.useState(item?.cohort_id ?? "");
  const [phaseId, setPhaseId] = React.useState(item?.phase_id ?? "");
  const [weekId, setWeekId] = React.useState(item?.week_id ?? "");
  const [sessionId, setSessionId] = React.useState(item?.session_id ?? "");
  const [title, setTitle] = React.useState(item?.title ?? "");
  const [description, setDescription] = React.useState(item?.description ?? "");
  const [category, setCategory] = React.useState(item?.category ?? "");
  const [dueAt, setDueAt] = React.useState(toLocalDateTime(item?.due_at));
  const [actionLabel, setActionLabel] = React.useState(item?.action_label ?? "");
  const [actionUrl, setActionUrl] = React.useState(item?.action_url ?? "");
  const [isRequired, setIsRequired] = React.useState(item?.is_required ?? true);
  const [isActive, setIsActive] = React.useState(item?.is_active ?? true);
  const [sequence, setSequence] = React.useState(item?.sequence ?? 0);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedCohort = cohorts.find((cohort) => cohort.id === cohortId);
  const availablePhases = phases.filter(
    (phase) => !selectedCohort || phase.program_id === selectedCohort.program_id
  );
  const availableWeeks = weeks.filter((week) => !phaseId || week.phase_id === phaseId);
  const availableSessions = sessions.filter(
    (session) =>
      (!cohortId || session.cohort_id === cohortId) &&
      (!phaseId || session.phase_id === phaseId) &&
      (!weekId || session.week_id === weekId)
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        cohort_id: cohortId || null,
        phase_id: phaseId || null,
        week_id: weekId || null,
        session_id: sessionId || null,
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        action_label: actionLabel.trim() || null,
        action_url: actionUrl.trim() || null,
        is_required: isRequired,
        is_active: isActive,
        sequence: Number(sequence),
      };

      if (item) await updateChecklistItem(item.id, payload);
      else await createChecklistItem(payload);
      await onSaved();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save checklist item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
      <form onSubmit={handleSubmit} className="max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 shadow-2xl sm:max-h-[90vh] sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold">{item ? "Edit Checklist Item" : "Create Checklist Item"}</h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Target all Fellows or narrow this action to a Cohort, Phase, Week, or Session.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close checklist item modal" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]">×</button>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold">Target Cohort
            <select value={cohortId} onChange={(event) => { setCohortId(event.target.value); setPhaseId(""); setWeekId(""); setSessionId(""); }} className={`${fieldClass} mt-1 font-normal`}>
              <option value="">All Cohorts</option>
              {cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold">Phase (optional)
            <select value={phaseId} onChange={(event) => { setPhaseId(event.target.value); setWeekId(""); setSessionId(""); }} className={`${fieldClass} mt-1 font-normal`}>
              <option value="">All Phases</option>
              {availablePhases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name} ({phase.code})</option>)}
            </select>
          </label>
          <label className="text-xs font-bold">Week (optional)
            <select value={weekId} onChange={(event) => { setWeekId(event.target.value); setSessionId(""); }} disabled={!phaseId} className={`${fieldClass} mt-1 font-normal disabled:opacity-60`}>
              <option value="">All Weeks</option>
              {availableWeeks.map((week) => <option key={week.id} value={week.id}>Week {week.week_number} — {week.title}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold">Session (optional)
            <select value={sessionId} onChange={(event) => setSessionId(event.target.value)} className={`${fieldClass} mt-1 font-normal`}>
              <option value="">All Sessions</option>
              {availableSessions.map((session) => {
                const cohort = cohorts.find((entry) => entry.id === session.cohort_id);
                return <option key={session.id} value={session.id}>{cohort?.name ?? "Cohort"} — Session {session.session_number}: {session.title}</option>;
              })}
            </select>
          </label>
        </div>

        <div className="mt-4 space-y-4">
          <label className="block text-xs font-bold">Title *
            <input required maxLength={300} value={title} onChange={(event) => setTitle(event.target.value)} className={`${fieldClass} mt-1 font-normal`} />
          </label>
          <label className="block text-xs font-bold">Description
            <textarea rows={3} maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} className={`${fieldClass} mt-1 resize-y font-normal`} />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold">Category
              <input maxLength={100} value={category} onChange={(event) => setCategory(event.target.value)} className={`${fieldClass} mt-1 font-normal`} />
            </label>
            <label className="text-xs font-bold">Due Date / Time
              <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className={`${fieldClass} mt-1 font-normal`} />
            </label>
            <label className="text-xs font-bold">Action Label
              <input maxLength={100} value={actionLabel} onChange={(event) => setActionLabel(event.target.value)} placeholder="Open submission" className={`${fieldClass} mt-1 font-normal`} />
            </label>
            <label className="text-xs font-bold">Action URL
              <input maxLength={1000} value={actionUrl} onChange={(event) => setActionUrl(event.target.value)} placeholder="/sessions/... or https://..." className={`${fieldClass} mt-1 font-normal`} />
            </label>
            <label className="text-xs font-bold">Display Order
              <input type="number" min={0} value={sequence} onChange={(event) => setSequence(Number(event.target.value))} className={`${fieldClass} mt-1 font-normal`} />
            </label>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-4 sm:flex-row sm:gap-8">
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={isRequired} onChange={(event) => setIsRequired(event.target.checked)} className="h-4 w-4 accent-[var(--color-brand-blue)]" /> Required</label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="h-4 w-4 accent-[var(--color-brand-blue)]" /> Active</label>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--color-border-default)] px-4 py-2.5 text-sm font-bold">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-xl bg-[var(--color-brand-blue)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving..." : item ? "Save Changes" : "Create Item"}</button>
        </div>
      </form>
    </div>
  );
}
