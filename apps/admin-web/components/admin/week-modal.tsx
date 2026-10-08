"use client";

import * as React from "react";

import {
  AdminPhase,
  AdminWeek,
  createWeek,
  updateWeek,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/client";

interface WeekModalProps {
  week?: AdminWeek | null;
  phases: AdminPhase[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export function WeekModal({
  week,
  phases,
  onClose,
  onSaved,
}: WeekModalProps) {
  const isEdit = Boolean(week);

  const [phaseId, setPhaseId] = React.useState(
    week?.phase_id ?? phases[0]?.id ?? ""
  );

  const [weekNumber, setWeekNumber] = React.useState(
    week?.week_number ?? 1
  );

  const [title, setTitle] = React.useState(
    week?.title ?? ""
  );

  const [strategicQuestion, setStrategicQuestion] =
    React.useState(week?.strategic_question ?? "");

  const [description, setDescription] =
    React.useState(week?.description ?? "");

  const [sequence, setSequence] = React.useState(
    week?.sequence ?? 1
  );

  const [unlockAt, setUnlockAt] = React.useState(
    week?.unlock_at
      ? new Date(week.unlock_at).toISOString().slice(0, 16)
      : ""
  );

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);
    setError(null);

    try {
      const payload = {
        phase_id: phaseId,
        week_number: Number(weekNumber),
        title: title.trim(),
        strategic_question:
          strategicQuestion.trim() || undefined,
        description: description.trim() || undefined,
        sequence: Number(sequence),
        unlock_at: unlockAt
          ? new Date(unlockAt).toISOString()
          : undefined,
      };

      if (isEdit && week) {
        await updateWeek(week.id, payload);
      } else {
        await createWeek(payload);
      }

      await onSaved();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to save week."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-5 sm:p-6 w-full max-w-xl shadow-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-extrabold">
              {isEdit ? "Edit Week" : "Create Week"}
            </h3>

            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Manage the weekly curriculum structure.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xl text-[var(--color-text-muted)]"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">
              Phase
            </label>

            <select
              required
              value={phaseId}
              disabled={isEdit}
              onChange={(e) => setPhaseId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            >
              <option value="">Select Phase</option>

              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name} ({phase.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">
                Week Number
              </label>

              <input
                type="number"
                min={1}
                max={12}
                required
                value={weekNumber}
                onChange={(e) =>
                  setWeekNumber(Number(e.target.value))
                }
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                Sequence
              </label>

              <input
                type="number"
                min={1}
                required
                value={sequence}
                onChange={(e) =>
                  setSequence(Number(e.target.value))
                }
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Week Title
            </label>

            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="DISCOVER THE REAL PROBLEM"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Strategic Question
            </label>

            <input
              type="text"
              value={strategicQuestion}
              onChange={(e) =>
                setStrategicQuestion(e.target.value)
              }
              placeholder="What is really happening here?"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Description
            </label>

            <textarea
              rows={4}
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Unlock At
            </label>

            <input
              type="datetime-local"
              value={unlockAt}
              onChange={(e) =>
                setUnlockAt(e.target.value)
              }
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border-default)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--color-border-default)] text-xs font-bold"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || !phaseId}
            className="px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Create Week"}
          </button>
        </div>
      </form>
    </div>
  );
}
