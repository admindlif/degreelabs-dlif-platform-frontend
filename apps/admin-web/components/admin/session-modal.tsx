"use client";

import * as React from "react";

import {
  AdminCohort,
  AdminPhase,
  AdminSession,
  AdminWeek,
  createSession,
  updateSession,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/client";

interface SessionModalProps {
  session?: AdminSession | null;
  cohorts: AdminCohort[];
  phases: AdminPhase[];
  weeks: AdminWeek[];
  sessions: AdminSession[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}
function toLocalDateTimeInput(
  value: string | null | undefined
): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (number: number) =>
    String(number).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}`
  );
}

export function SessionModal({
  session,
  cohorts,
  phases,
  weeks,
  sessions,
  onClose,
  onSaved,
}: SessionModalProps) {
  const isEdit = Boolean(session);
  const initialCohortId = session?.cohort_id ?? cohorts[0]?.id ?? "";
  const initialCohort = cohorts.find(
    (cohort) => cohort.id === initialCohortId
  );
  const initialPhaseId =
    session?.phase_id ??
    phases.find(
      (phase) => phase.program_id === initialCohort?.program_id
    )?.id ??
    "";
  const initialCohortSessions = sessions.filter(
    (item) => item.cohort_id === initialCohortId
  );
  const initialSessionNumber =
    initialCohortSessions.reduce(
      (maximum, item) => Math.max(maximum, item.session_number),
      -1
    ) + 1;
  const initialSequence =
    initialCohortSessions.reduce(
      (maximum, item) => Math.max(maximum, item.sequence),
      -1
    ) + 1;

  const [cohortId, setCohortId] = React.useState(
    initialCohortId
  );

  const [phaseId, setPhaseId] = React.useState(
    initialPhaseId
  );

  const [weekId, setWeekId] = React.useState(
    session?.week_id ?? ""
  );

  const [sessionNumber, setSessionNumber] = React.useState(
    session?.session_number ?? initialSessionNumber
  );

  const [sessionType, setSessionType] = React.useState(
    session?.session_type ?? "learn_work"
  );

  const [title, setTitle] = React.useState(
    session?.title ?? ""
  );

  const [description, setDescription] = React.useState(
    session?.description ?? ""
  );

  const [startAt, setStartAt] = React.useState(
    toLocalDateTimeInput(
      session?.start_at
    )
  );

  const [endAt, setEndAt] = React.useState(
    toLocalDateTimeInput(
      session?.end_at
    )
  );


  const [recordingUrl, setRecordingUrl] = React.useState(
    session?.recording_url ?? ""
  );
  const [transcriptUrl, setTranscriptUrl] = React.useState(
    session?.transcript_url ?? ""
  );

  const [submissionEnabled, setSubmissionEnabled] =
    React.useState(
      session?.submission_enabled ?? false
    );

  const [status, setStatus] = React.useState(
    session?.status ?? "scheduled"
  );

  const [sequence, setSequence] = React.useState(
    session?.sequence ?? initialSequence
  );

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedCohort = cohorts.find(
    (cohort) => cohort.id === cohortId
  );
  const filteredPhases = selectedCohort
    ? phases.filter(
        (phase) => phase.program_id === selectedCohort.program_id
      )
    : [];
  const selectedPhase = filteredPhases.find(
    (phase) => phase.id === phaseId
  );
  const filteredWeeks = selectedPhase
    ? weeks.filter((week) => week.phase_id === selectedPhase.id)
    : [];
  const conflictingSessionNumber = sessions.find(
    (item) =>
      item.cohort_id === cohortId &&
      item.id !== session?.id &&
      item.session_number === Number(sessionNumber)
  );
  const conflictingSequence = sessions.find(
    (item) =>
      item.cohort_id === cohortId &&
      item.id !== session?.id &&
      item.sequence === Number(sequence)
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedCohort || !selectedPhase) {
      setError(
        "Select a Phase that belongs to the selected Cohort's Program."
      );
      return;
    }
    if (conflictingSessionNumber || conflictingSequence) {
      setError(
        "Session Number and Sequence must be unique within the selected Cohort."
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEdit && session) {
        await updateSession(session.id, {
          week_id: weekId || null,
          session_number: Number(sessionNumber),
          session_type: sessionType,
          title: title.trim(),
          description: description.trim() || undefined,
          start_at: startAt
            ? new Date(startAt).toISOString()
            : undefined,
          end_at: endAt
            ? new Date(endAt).toISOString()
            : undefined,
          recording_url: recordingUrl.trim() || undefined,
          transcript_url: transcriptUrl.trim() || undefined,
          submission_enabled: submissionEnabled,
          status,
          sequence: Number(sequence),
        });
      } else {
        await createSession({
          cohort_id: cohortId,
          phase_id: phaseId,
          week_id: weekId || null,
          session_number: Number(sessionNumber),
          session_type: sessionType,
          title: title.trim(),
          description: description.trim() || undefined,
          start_at: new Date(startAt).toISOString(),
          end_at: new Date(endAt).toISOString(),
          recording_url: recordingUrl.trim() || undefined,
          transcript_url: transcriptUrl.trim() || undefined,
          submission_enabled: submissionEnabled,
          status,
          sequence: Number(sequence),
        });
      }
      await onSaved();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to save session."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 shadow-2xl sm:max-h-[90vh] sm:p-6"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold">
              {isEdit ? "Edit Session" : "Create Session"}
            </h3>

            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Create and schedule a Fellowship session.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Session modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">

          <div>
            <label className="block text-xs font-bold mb-1">
              Cohort *
            </label>

            <select
              required
              disabled={isEdit}
              value={cohortId}
              onChange={(e) => {
                const nextCohortId = e.target.value;
                const nextCohort = cohorts.find(
                  (cohort) => cohort.id === nextCohortId
                );
                const nextPhases = nextCohort
                  ? phases.filter(
                      (phase) =>
                        phase.program_id === nextCohort.program_id
                    )
                  : [];
                const nextCohortSessions = sessions.filter(
                  (item) => item.cohort_id === nextCohortId
                );

                setCohortId(nextCohortId);
                setPhaseId((currentPhaseId) =>
                  nextPhases.some(
                    (phase) => phase.id === currentPhaseId
                  )
                    ? currentPhaseId
                    : nextPhases[0]?.id ?? ""
                );
                setWeekId("");
                setSessionNumber(
                  nextCohortSessions.reduce(
                    (maximum, item) =>
                      Math.max(maximum, item.session_number),
                    -1
                  ) + 1
                );
                setSequence(
                  nextCohortSessions.reduce(
                    (maximum, item) =>
                      Math.max(maximum, item.sequence),
                    -1
                  ) + 1
                );
              }}
              className="w-full px-3 py-2.5 rounded-xl border"
            >
              <option value="">Select Cohort</option>

              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Phase *
            </label>

            <select
              required
              disabled={isEdit}
              value={phaseId}
              onChange={(e) => {
                setPhaseId(e.target.value);
                setWeekId("");
              }}
              className="w-full px-3 py-2.5 rounded-xl border"
            >
              <option value="">Select Phase</option>

              {filteredPhases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name} ({phase.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Week
            </label>

            <select
              value={weekId}
              onChange={(e) => setWeekId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border"
            >
              <option value="">
                No Week / Session 0
              </option>

              {filteredWeeks.map((week) => (
                <option key={week.id} value={week.id}>
                  Week {week.week_number} — {week.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold mb-1">
                Session Number *
              </label>

              <input
                type="number"
                min={0}
                required
                value={sessionNumber}
                onChange={(e) =>
                  setSessionNumber(Number(e.target.value))
                }
                className="w-full px-3 py-2.5 rounded-xl border"
              />
              {conflictingSessionNumber && (
                <p className="mt-1 text-[11px] text-red-600">
                  Session {sessionNumber} already exists for this Cohort.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                Sequence *
              </label>

              <input
                type="number"
                min={0}
                required
                value={sequence}
                onChange={(e) =>
                  setSequence(Number(e.target.value))
                }
                className="w-full px-3 py-2.5 rounded-xl border"
              />
              {conflictingSequence && (
                <p className="mt-1 text-[11px] text-red-600">
                  Sequence {sequence} is already in use for this Cohort.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Session Type
            </label>

            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border"
            >
              <option value="induction">Induction</option>
              <option value="learn_work">Learn + Work</option>
              <option value="output_review">
                Output + Review
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Session Title *
            </label>

            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Problem Framing & Diagnosis"
              className="w-full px-3 py-2.5 rounded-xl border"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Description
            </label>

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">
                Start Date & Time
              </label>

              <input
                type="datetime-local"
                required
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                End Date & Time
              </label>

              <input
                type="datetime-local"
                required
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Recording URL
            </label>

            <input
              value={recordingUrl}
              onChange={(e) => setRecordingUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full px-3 py-2.5 rounded-xl border"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Transcript URL
            </label>

            <input
              value={transcriptUrl}
              onChange={(e) => setTranscriptUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full px-3 py-2.5 rounded-xl border"
            />
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-4">
            <input
              id="submission-enabled"
              type="checkbox"
              checked={submissionEnabled}
              onChange={(e) =>
                setSubmissionEnabled(e.target.checked)
              }
              className="h-4 w-4"
            />

            <div>
              <label
                htmlFor="submission-enabled"
                className="text-sm font-bold cursor-pointer"
              >
                Enable Team Submission
              </label>

              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Allow the Team Lead to submit or resubmit a Google Drive link for this Session.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Status
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border"
            >
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[var(--color-border-default)] pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-xl border border-[var(--color-border-default)] px-4 py-2 text-xs font-bold"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving ||
              !cohortId ||
              !selectedPhase ||
              Boolean(conflictingSessionNumber) ||
              Boolean(conflictingSequence) ||
              !title.trim() ||
              !startAt ||
              !endAt
            }
            className="min-h-10 rounded-xl bg-[var(--color-brand-blue)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Create Session"}
          </button>
        </div>
      </form>
    </div>
  );
}
