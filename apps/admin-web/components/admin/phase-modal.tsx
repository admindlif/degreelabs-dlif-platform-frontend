"use client";

import * as React from "react";

import {
  AdminPhase,
  AdminProgram,
  createPhase,
  updatePhase,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/client";

interface PhaseModalProps {
  phase?: AdminPhase | null;
  programs: AdminProgram[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export function PhaseModal({
  phase,
  programs,
  onClose,
  onSaved,
}: PhaseModalProps) {
  const isEdit = Boolean(phase);

  const [programId, setProgramId] = React.useState(
    phase?.program_id ?? programs[0]?.id ?? ""
  );

  const [code, setCode] = React.useState(
    phase?.code ?? ""
  );

  const [name, setName] = React.useState(
    phase?.name ?? ""
  );

  const [developmentRole, setDevelopmentRole] =
    React.useState(
      phase?.development_role ?? ""
    );

  const [sequence, setSequence] =
    React.useState(
      phase?.sequence ?? 1
    );

  const [description, setDescription] =
    React.useState(
      phase?.description ?? ""
    );

  const [durationWeeks, setDurationWeeks] =
    React.useState(
      phase?.duration_weeks ?? 4
    );

  const [isActive, setIsActive] =
    React.useState(
      phase?.is_active ?? true
    );

  const [saving, setSaving] =
    React.useState(false);

  const [error, setError] =
    React.useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setSaving(true);
    setError(null);

    try {
      const payload = {
        program_id: programId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        development_role:
          developmentRole.trim(),
        sequence: Number(sequence),
        description:
          description.trim() || undefined,
        duration_weeks:
          Number(durationWeeks),
        is_active: isActive,
      };

      if (isEdit && phase) {
        await updatePhase(
          phase.id,
          payload
        );
      } else {
        await createPhase(payload);
      }

      await onSaved();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to save phase."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-extrabold">
              {isEdit
                ? "Edit Phase"
                : "Create Phase"}
            </h3>

            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Manage the fellowship phase structure.
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
              Program
            </label>

            <select
              required
              value={programId}
              disabled={isEdit}
              onChange={(e) =>
                setProgramId(e.target.value)
              }
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            >
              <option value="">
                Select Program
              </option>

              {programs.map((program) => (
                <option
                  key={program.id}
                  value={program.id}
                >
                  {program.name} ({program.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="block text-xs font-bold mb-1">
                Phase Code
              </label>

              <input
                required
                value={code}
                onChange={(e) =>
                  setCode(e.target.value)
                }
                placeholder="DISCOVER"
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
                  setSequence(
                    Number(e.target.value)
                  )
                }
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
              />
            </div>

          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Phase Name
            </label>

            <input
              required
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="DISCOVER"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Development Role
            </label>

            <input
              required
              value={developmentRole}
              onChange={(e) =>
                setDevelopmentRole(
                  e.target.value
                )
              }
              placeholder="THINK"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Duration (Weeks)
            </label>

            <input
              type="number"
              min={1}
              required
              value={durationWeeks}
              onChange={(e) =>
                setDurationWeeks(
                  Number(e.target.value)
                )
              }
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
                setDescription(
                  e.target.value
                )
              }
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) =>
                setIsActive(
                  e.target.checked
                )
              }
            />

            Active Phase
          </label>

        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border-default)]">

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--color-border-default)] text-xs font-bold"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving || !programId
            }
            className="px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Create Phase"}
          </button>

        </div>
      </form>
    </div>
  );
}
