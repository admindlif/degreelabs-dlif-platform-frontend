"use client";

import * as React from "react";

import {
    AdminCohort,
    AdminCohortFellow,
    AdminFellow,
    addFellowToCohort,
    getCohortFellows,
    removeFellowFromCohort,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/client";

interface CohortFellowsModalProps {
    cohort: AdminCohort;
    fellows: AdminFellow[];
    onClose: () => void;
    onSaved: () => Promise<void> | void;
}

export function CohortFellowsModal({
    cohort,
    fellows,
    onClose,
    onSaved,
}: CohortFellowsModalProps) {
    const [enrolled, setEnrolled] =
        React.useState<AdminCohortFellow[]>([]);

    const [loading, setLoading] =
        React.useState(true);

    const [busyId, setBusyId] =
        React.useState<string | null>(null);

    const [error, setError] =
        React.useState<string | null>(null);

    async function loadEnrolled() {
        try {
            setLoading(true);

            const data = await getCohortFellows(
                cohort.id
            );

            setEnrolled(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Unable to load cohort Fellows."));
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        let cancelled = false;

        void getCohortFellows(cohort.id)
            .then((data) => {
                if (!cancelled) setEnrolled(data);
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(getErrorMessage(err, "Unable to load cohort Fellows."));
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [cohort.id]);

    const enrolledIds = new Set(
        enrolled.map(
            (item) => item.fellow_id
        )
    );

    async function handleAdd(
        fellow: AdminFellow
    ) {
        try {
            setBusyId(fellow.id);
            setError(null);

            await addFellowToCohort(
                cohort.id,
                fellow.id
            );

            await loadEnrolled();
            await onSaved();

        } catch (err: unknown) {
            setError(getErrorMessage(err, "Unable to enroll Fellow."));
        } finally {
            setBusyId(null);
        }
    }

    async function handleRemove(
        fellow: AdminFellow
    ) {
        if (
            !window.confirm(
                `Remove ${fellow.first_name} ${fellow.last_name} from ${cohort.name}?`
            )
        ) {
            return;
        }

        try {
            setBusyId(fellow.id);
            setError(null);

            await removeFellowFromCohort(
                cohort.id,
                fellow.id
            );

            await loadEnrolled();
            await onSaved();

        } catch (err: unknown) {
            setError(getErrorMessage(err, "Unable to remove Fellow."));
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">

                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-lg font-extrabold">
                            Manage Fellows
                        </h3>

                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            {cohort.name} • {cohort.code}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xl"
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="py-10 text-center text-sm text-[var(--color-text-muted)]">
                        Loading Fellows...
                    </div>
                ) : (
                    <div className="space-y-3">

                        {fellows.map((fellow) => {
                            const isEnrolled =
                                enrolledIds.has(fellow.id);

                            return (
                                <div
                                    key={fellow.id}
                                    className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[var(--color-border-default)]"
                                >
                                    <div>
                                        <div className="font-bold text-sm">
                                            {fellow.first_name}{" "}
                                            {fellow.last_name}
                                        </div>

                                        <div className="text-xs text-[var(--color-text-muted)]">
                                            {fellow.email}
                                        </div>

                                        <div className="text-[10px] uppercase font-bold mt-1">
                                            {fellow.account_status}
                                        </div>
                                    </div>

                                    {isEnrolled ? (
                                        <button
                                            type="button"
                                            disabled={
                                                busyId === fellow.id
                                            }
                                            onClick={() =>
                                                handleRemove(fellow)
                                            }
                                            className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-bold disabled:opacity-50"
                                        >
                                            {busyId === fellow.id
                                                ? "Removing..."
                                                : "Remove"}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={
                                                busyId === fellow.id
                                            }
                                            onClick={() =>
                                                handleAdd(fellow)
                                            }
                                            className="px-3 py-2 rounded-lg bg-[var(--color-brand-blue)] text-white text-xs font-bold disabled:opacity-50"
                                        >
                                            {busyId === fellow.id
                                                ? "Adding..."
                                                : "Add to Cohort"}
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                    </div>
                )}

                <div className="flex justify-end mt-6 pt-4 border-t border-[var(--color-border-default)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border text-xs font-bold"
                    >
                        Done
                    </button>
                </div>

            </div>
        </div>
    );
}
