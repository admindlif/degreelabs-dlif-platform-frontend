"use client";

import * as React from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createMentorChecklistDefinition,
  getTeamSessions,
  updateMentorChecklistDefinition,
} from "@/lib/api/mentor";
import type {
  MentorChecklistDefinition,
  MentorTeamSummary,
  SessionSummary,
} from "@/lib/api/types";

interface Props {
  open: boolean;
  teams: MentorTeamSummary[];
  initialTeamId: string;
  item: MentorChecklistDefinition | null;
  onClose: () => void;
  onSaved: (item: MentorChecklistDefinition) => void;
}

const fieldClass =
  "w-full rounded-xl border border-[var(--color-border-default)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-orange)] focus:ring-1 focus:ring-[var(--color-brand-orange)] disabled:bg-[var(--color-bg-subtle)] disabled:text-[var(--color-text-muted)]";

function toLocalDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function MentorChecklistItemModal({
  open,
  teams,
  initialTeamId,
  item,
  onClose,
  onSaved,
}: Props) {
  const editing = Boolean(item);
  const [teamId, setTeamId] = React.useState(initialTeamId);
  const [sessions, setSessions] = React.useState<SessionSummary[]>([]);
  const [weekId, setWeekId] = React.useState("");
  const [sessionId, setSessionId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  const [actionUrl, setActionUrl] = React.useState("");
  const [isRequired, setIsRequired] = React.useState(true);
  const [isActive, setIsActive] = React.useState(true);
  const [loadingSessions, setLoadingSessions] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedTeam = teams.find((team) => team.id === teamId) ?? null;
  const phaseId = selectedTeam?.current_phase?.id ?? "";
  const phaseSessions = sessions.filter((session) => session.phase_id === phaseId);
  const weeks = React.useMemo(() => {
    const unique = new Map<string, { id: string; label: string }>();
    for (const session of phaseSessions) {
      if (session.week_id) {
        unique.set(session.week_id, {
          id: session.week_id,
          label: session.week_title || `Week ${session.week_number ?? ""}`.trim(),
        });
      }
    }
    return [...unique.values()];
  }, [phaseSessions]);
  const weekSessions = phaseSessions.filter((session) => session.week_id === weekId);

  React.useEffect(() => {
    if (!open) return;
    const effectiveTeamId = item?.applicable_team_id || initialTeamId || teams[0]?.id || "";
    setTeamId(effectiveTeamId);
    setWeekId(item?.week_id ?? "");
    setSessionId(item?.session_id ?? "");
    setTitle(item?.title ?? "");
    setDescription(item?.description ?? "");
    setDueAt(toLocalDateTime(item?.due_at ?? null));
    setActionUrl(item?.action_url ?? "");
    setIsRequired(item?.is_required ?? true);
    setIsActive(item?.is_active ?? true);
    setError(null);
  }, [open, item, initialTeamId, teams]);

  React.useEffect(() => {
    if (!open || !teamId) return;
    setLoadingSessions(true);
    getTeamSessions(teamId)
      .then((response) => setSessions(response.sessions))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Unable to load sessions.")
      )
      .finally(() => setLoadingSessions(false));
  }, [open, teamId]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!teamId || !phaseId || !weekId || !sessionId || !title.trim()) {
      setError("Team, phase, week, session, and title are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const common = {
        phase_id: phaseId,
        week_id: weekId,
        session_id: sessionId,
        title: title.trim(),
        description: description.trim() || null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        action_url: actionUrl.trim() || null,
        action_label: actionUrl.trim() ? "Open" : null,
        is_required: isRequired,
      };
      const saved = item
        ? await updateMentorChecklistDefinition(item.id, common)
        : await createMentorChecklistDefinition({
            ...common,
            team_id: teamId,
            is_active: isActive,
          });
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to save checklist item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--color-border-default)] px-6 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--color-text-primary)]">
              {editing ? "Edit Checklist Item" : "Create Checklist Item"}
            </h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Assign one shared definition to every Fellow on the selected team.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-bold text-[var(--color-text-body)]">
              Assigned Team <span className="text-red-500">*</span>
              <select
                className={fieldClass}
                value={teamId}
                disabled={editing}
                onChange={(event) => {
                  setTeamId(event.target.value);
                  setWeekId("");
                  setSessionId("");
                }}
              >
                <option value="">Select a team</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-bold text-[var(--color-text-body)]">
              Phase <span className="text-red-500">*</span>
              <input className={fieldClass} value={selectedTeam?.current_phase?.code ?? "No applicable phase"} disabled />
            </label>
            <label className="space-y-1.5 text-xs font-bold text-[var(--color-text-body)]">
              Week <span className="text-red-500">*</span>
              <select className={fieldClass} value={weekId} disabled={loadingSessions || !phaseId} onChange={(event) => { setWeekId(event.target.value); setSessionId(""); }}>
                <option value="">Select a week</option>
                {weeks.map((week) => <option key={week.id} value={week.id}>{week.label}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-bold text-[var(--color-text-body)]">
              Session <span className="text-red-500">*</span>
              <select className={fieldClass} value={sessionId} disabled={!weekId} onChange={(event) => setSessionId(event.target.value)}>
                <option value="">Select a session</option>
                {weekSessions.map((session) => <option key={session.id} value={session.id}>Session {session.session_number}: {session.title}</option>)}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5 text-xs font-bold text-[var(--color-text-body)]">
            Checklist Item Title <span className="text-red-500">*</span>
            <input className={fieldClass} value={title} maxLength={300} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="block space-y-1.5 text-xs font-bold text-[var(--color-text-body)]">
            Description / Instructions
            <textarea className={`${fieldClass} min-h-28 resize-y`} value={description} maxLength={5000} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-bold text-[var(--color-text-body)]">
              Due Date
              <input type="datetime-local" className={fieldClass} value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
            </label>
            <label className="space-y-1.5 text-xs font-bold text-[var(--color-text-body)]">
              Action Link
              <input type="url" className={fieldClass} placeholder="https://..." value={actionUrl} onChange={(event) => setActionUrl(event.target.value)} />
            </label>
          </div>
          <div className="flex flex-wrap gap-5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 text-sm">
            <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={isRequired} onChange={(event) => setIsRequired(event.target.checked)} /> Required</label>
            {!editing && <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /> Active</label>}
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--color-border-default)] pt-5">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || loadingSessions}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
