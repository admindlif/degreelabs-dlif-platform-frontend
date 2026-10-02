"use client";

import * as React from "react";

import {
    AdminProgram,
    createProgram,
    updateProgram,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/client";

interface ProgramModalProps {
    mode: "create" | "edit";
    program?: AdminProgram | null;
    onClose: () => void;
    onSaved: () => Promise<void> | void;
}

export function ProgramModal({
    mode,
    program,
    onClose,
    onSaved,
}: ProgramModalProps) {
    const [name, setName] = React.useState(program?.name ?? "");
    const [code, setCode] = React.useState(program?.code ?? "");
    const [description, setDescription] = React.useState(
        program?.description ?? ""
    );
    const [isActive, setIsActive] = React.useState(
        program?.is_active ?? true
    );

    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        setSaving(true);
        setError(null);

        try {
            const payload = {
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: description.trim(),
                is_active: isActive,
            };

            if (mode === "edit" && program) {
                await updateProgram(program.id, payload);
            } else {
                await createProgram(payload);
            }

            await onSaved();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Unable to save program."));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-extrabold">
                            {mode === "create" ? "Create Program" : "Edit Program"}
                        </h3>

                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            Manage a DegreeLabs fellowship program.
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
                            Program Name
                        </label>

                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="DegreeLabs Impact Fellowship"
                            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm outline-none focus:border-[var(--color-brand-blue)]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold mb-1">
                            Program Code
                        </label>

                        <input
                            type="text"
                            required
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            placeholder="DLIF"
                            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm outline-none focus:border-[var(--color-brand-blue)]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold mb-1">
                            Description
                        </label>

                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            rows={4}
                            placeholder="Program description"
                            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm outline-none focus:border-[var(--color-brand-blue)] resize-none"
                        />
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(event) => setIsActive(event.target.checked)}
                        />

                        Active Program
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
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold disabled:opacity-50"
                    >
                        {saving
                            ? "Saving..."
                            : mode === "create"
                                ? "Create Program"
                                : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
