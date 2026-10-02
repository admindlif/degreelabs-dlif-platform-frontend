"use client";

import * as React from "react";

import {
    AdminFeedbackStatus,
    getAdminSubmissionFeedback,
    saveAdminSubmissionFeedback,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/client";

interface SubmissionFeedbackModalProps {
    submissionId: string;
    teamName: string;
    teamLeadName?: string | null;

    onClose: () => void;
    onSaved: () => Promise<void> | void;
}

export function SubmissionFeedbackModal({
    submissionId,
    teamName,
    teamLeadName,
    onClose,
    onSaved,
}: SubmissionFeedbackModalProps) {
    const [feedbackText, setFeedbackText] =
        React.useState("");

    const [feedbackUrl, setFeedbackUrl] =
        React.useState("");

    const [status, setStatus] =
        React.useState<AdminFeedbackStatus>(
            "revision_required"
        );

    const [loading, setLoading] =
        React.useState(true);

    const [saving, setSaving] =
        React.useState(false);

    const [error, setError] =
        React.useState<string | null>(null);

    React.useEffect(() => {
        async function loadFeedback() {
            setLoading(true);
            setError(null);

            try {
                const existing =
                    await getAdminSubmissionFeedback(
                        submissionId
                    );

                if (existing) {
                    setFeedbackText(
                        existing.feedback_text
                    );

                    setFeedbackUrl(
                        existing.feedback_url ?? ""
                    );

                    setStatus(
                        existing.status
                    );
                }
            } catch (err: unknown) {
                setError(getErrorMessage(err, "Unable to load feedback."));
            } finally {
                setLoading(false);
            }
        }

        loadFeedback();
    }, [submissionId]);

    async function handleSave(
        event: React.FormEvent
    ) {
        event.preventDefault();

        if (!feedbackText.trim()) {
            setError(
                "Feedback text is required."
            );

            return;
        }

        setSaving(true);
        setError(null);

        try {
            await saveAdminSubmissionFeedback(
                submissionId,
                {
                    feedback_text:
                        feedbackText.trim(),

                    feedback_url:
                        feedbackUrl.trim() ||
                        null,

                    status,
                }
            );

            await onSaved();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Unable to save feedback."));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">

            <form
                onSubmit={handleSave}
                className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 shadow-2xl sm:max-h-[90vh] sm:p-6"
            >
                {/* HEADER */}
                <div className="flex items-start justify-between mb-6">

                    <div>
                        <h3 className="text-lg font-extrabold">
                            Review Submission
                        </h3>

                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            Team {teamName}
                            {teamLeadName
                                ? ` • Team Lead: ${teamLeadName}`
                                : ""}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close feedback modal"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]"
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
                        Loading feedback...
                    </div>
                ) : (
                    <div className="space-y-5">

                        {/* STATUS */}
                        <div>
                            <label className="block text-xs font-bold mb-1">
                                Review Status *
                            </label>

                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(
                                        event.target
                                            .value as AdminFeedbackStatus
                                    )
                                }
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]"
                            >
                                <option value="revision_required">
                                    Revision Required
                                </option>

                                <option value="accepted">
                                    Accepted
                                </option>
                            </select>
                        </div>

                        {/* FEEDBACK */}
                        <div>
                            <label className="block text-xs font-bold mb-1">
                                Feedback *
                            </label>

                            <textarea
                                required
                                rows={7}
                                value={feedbackText}
                                onChange={(event) =>
                                    setFeedbackText(
                                        event.target.value
                                    )
                                }
                                placeholder="Write feedback for the Team..."
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] resize-y"
                            />
                        </div>

                        {/* OPTIONAL DRIVE LINK */}
                        <div>
                            <label className="block text-xs font-bold mb-1">
                                Feedback / Reference Link
                            </label>

                            <input
                                type="url"
                                value={feedbackUrl}
                                onChange={(event) =>
                                    setFeedbackUrl(
                                        event.target.value
                                    )
                                }
                                placeholder="https://drive.google.com/..."
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]"
                            />

                            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                                Optional Google Drive or reference link for the Team.
                            </p>
                        </div>

                    </div>
                )}

                {/* ACTIONS */}
                {!loading && (
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
                                !feedbackText.trim()
                            }
                            className="min-h-10 rounded-xl bg-[var(--color-brand-blue)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                            {saving
                                ? "Saving..."
                                : "Save Feedback"}
                        </button>

                    </div>
                )}

            </form>
        </div>
    );
}
