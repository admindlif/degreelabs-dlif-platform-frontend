"use client";

import * as React from "react";

import {
    AdminCohort,
    AdminProgram,
    createCohort,
    updateCohort,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/client";

interface CohortModalProps {
    cohort?: AdminCohort | null;
    programs: AdminProgram[];
    onClose: () => void;
    onSaved: () => Promise<void> | void;
}

export function CohortModal({
    cohort,
    programs,
    onClose,
    onSaved,
}: CohortModalProps) {
    const isEdit = Boolean(cohort);

    const [programId, setProgramId] = React.useState(
        cohort?.program_id ?? programs[0]?.id ?? ""
    );

    const [name, setName] = React.useState(cohort?.name ?? "");
    const [code, setCode] = React.useState(cohort?.code ?? "");
    const [startDate, setStartDate] = React.useState(
        cohort?.start_date ?? ""
    );
    const [endDate, setEndDate] = React.useState(
        cohort?.end_date ?? ""
    );
    const [status, setStatus] = React.useState(
        cohort?.status ?? "active"
    );

    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        setSaving(true);
        setError(null);

        try {
            const payload = {
                program_id: programId,
                name: name.trim(),
                code: code.trim().toUpperCase(),
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                status,
            };

            if (isEdit && cohort) {
                await updateCohort(cohort.id, {
                    name: payload.name,
                    code: payload.code,
                    start_date: payload.start_date,
                    end_date: payload.end_date,
                    status: payload.status,
                });
            } else {
                await createCohort(payload);
            }

            await onSaved();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Unable to save cohort."));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
            <form
                onSubmit={handleSubmit}
                className="max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 shadow-2xl sm:max-h-[90vh] sm:p-6"
            >
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-extrabold">
                            {isEdit ? "Edit Cohort" : "Create Cohort"}
                        </h3>

                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            Manage a DegreeLabs fellowship cohort.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
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
                            onChange={(event) =>
                                setProgramId(event.target.value)
                            }
                            disabled={isEdit}
                            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm outline-none focus:border-[var(--color-brand-blue)] disabled:opacity-60"
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

                    <div>
                        <label className="block text-xs font-bold mb-1">
                            Cohort Name
                        </label>

                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            placeholder="DLIF Cohort name"
                            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm outline-none focus:border-[var(--color-brand-blue)]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold mb-1">
                            Cohort Code
                        </label>

                        <input
                            type="text"
                            required
                            value={code}
                            onChange={(event) =>
                                setCode(event.target.value)
                            }
                            placeholder="Cohort code"
                            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm outline-none focus:border-[var(--color-brand-blue)]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-1">
                                Start Date
                            </label>

                            <input
                                type="date"
                                value={startDate}
                                onChange={(event) =>
                                    setStartDate(event.target.value)
                                }
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm outline-none focus:border-[var(--color-brand-blue)]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold mb-1">
                                End Date
                            </label>

                            <input
                                type="date"
                                value={endDate}
                                onChange={(event) =>
                                    setEndDate(event.target.value)
                                }
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm outline-none focus:border-[var(--color-brand-blue)]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold mb-1">
                            Status
                        </label>

                        <select
                            value={status}
                            onChange={(event) =>
                                setStatus(event.target.value)
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm outline-none focus:border-[var(--color-brand-blue)]"
                        >
                            <option value="draft">Draft</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
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
                        disabled={saving || !programId}
                        className="px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold disabled:opacity-50"
                    >
                        {saving
                            ? "Saving..."
                            : isEdit
                                ? "Save Changes"
                                : "Create Cohort"}
                    </button>
                </div>
            </form>
        </div>
    );
}
