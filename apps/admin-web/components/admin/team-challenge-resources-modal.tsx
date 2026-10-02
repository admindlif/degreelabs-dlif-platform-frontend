"use client";

import * as React from "react";
import {
    ExternalLink,
    FileText,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";

import {
    AdminTeam,
    TeamChallengeResource,
    createTeamChallengeResource,
    deleteTeamChallengeResource,
    getTeamChallengeResources,
    updateTeamChallengeResource,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/client";

interface TeamChallengeResourcesModalProps {
    team: AdminTeam;
    onClose: () => void;
}

export function TeamChallengeResourcesModal({
    team,
    onClose,
}: TeamChallengeResourcesModalProps) {
    const [resources, setResources] =
        React.useState<TeamChallengeResource[]>([]);

    const [loading, setLoading] =
        React.useState(true);

    const [saving, setSaving] =
        React.useState(false);

    const [error, setError] =
        React.useState<string | null>(null);

    const [editingId, setEditingId] =
        React.useState<string | null>(null);

    const [title, setTitle] =
        React.useState("");

    const [url, setUrl] =
        React.useState("");

    const [sequence, setSequence] =
        React.useState("0");

    const [isDownloadable, setIsDownloadable] =
        React.useState(false);

    const loadResources =
        React.useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const data =
                    await getTeamChallengeResources(
                        team.id
                    );

                setResources(data);
            } catch (err: unknown) {
                setError(getErrorMessage(err, "Unable to load challenge resources."));
            } finally {
                setLoading(false);
            }
        }, [team.id]);

    React.useEffect(() => {
        let cancelled = false;

        void getTeamChallengeResources(team.id)
            .then((data) => {
                if (!cancelled) setResources(data);
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(getErrorMessage(err, "Unable to load challenge resources."));
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [team.id]);

    function resetForm() {
        setEditingId(null);
        setTitle("");
        setUrl("");
        setSequence("0");
        setIsDownloadable(false);
    }

    function startEdit(
        resource: TeamChallengeResource
    ) {
        setEditingId(resource.id);
        setTitle(resource.title);
        setUrl(resource.url ?? "");
        setSequence(
            String(resource.sequence)
        );
        setIsDownloadable(
            resource.is_downloadable
        );
    }

    async function handleSubmit(
        event: React.FormEvent
    ) {
        event.preventDefault();

        if (!title.trim()) {
            setError(
                "Resource title is required."
            );
            return;
        }

        if (!url.trim()) {
            setError(
                "Resource URL is required."
            );
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const resourceData = {
                title: title.trim(),
                url: url.trim(),
                is_downloadable:
                    isDownloadable,
                sequence:
                    Number(sequence) || 0,
            };

            if (editingId) {
                await updateTeamChallengeResource(
                    team.id,
                    editingId,
                    resourceData
                );
            } else {
                await createTeamChallengeResource(
                    team.id,
                    {
                        ...resourceData,
                        resource_type: "link",
                    }
                );
            }

            resetForm();

            await loadResources();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Unable to save challenge resource."));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(
        resourceId: string
    ) {
        const confirmed = window.confirm(
            "Delete this challenge resource?"
        );

        if (!confirmed) {
            return;
        }

        setError(null);

        try {
            await deleteTeamChallengeResource(
                team.id,
                resourceId
            );

            if (editingId === resourceId) {
                resetForm();
            }

            await loadResources();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Unable to delete challenge resource."));
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
            <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 shadow-2xl sm:max-h-[90vh] sm:p-6">

                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-extrabold">
                            Challenge Resources
                        </h3>

                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            Team {team.name}
                        </p>

                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            Add Google Drive, Docs, or other
                            reference links for Fellows.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close challenge resources"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]"
                    >
                        ×
                    </button>
                </div>


                {/* Error */}
                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        {error}
                    </div>
                )}


                {/* Add / Edit form */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-4"
                >
                    <div className="mb-4 flex items-center gap-2">
                        <Plus className="h-4 w-4 text-[var(--color-brand-blue)]" />

                        <h4 className="text-sm font-bold">
                            {editingId
                                ? "Edit Resource"
                                : "Add Resource"}
                        </h4>
                    </div>

                    <div className="space-y-4">

                        {/* Title */}
                        <div>
                            <label className="mb-1 block text-xs font-bold">
                                Resource Title *
                            </label>

                            <input
                                required
                                value={title}
                                onChange={(event) =>
                                    setTitle(
                                        event.target.value
                                    )
                                }
                                placeholder="Example: Company Brief"
                                className="w-full rounded-xl border border-[var(--color-border-default)] px-3 py-2.5"
                            />
                        </div>


                        {/* URL */}
                        <div>
                            <label className="mb-1 block text-xs font-bold">
                                Drive / Document URL *
                            </label>

                            <input
                                required
                                type="url"
                                value={url}
                                onChange={(event) =>
                                    setUrl(
                                        event.target.value
                                    )
                                }
                                placeholder="https://drive.google.com/..."
                                className="w-full rounded-xl border border-[var(--color-border-default)] px-3 py-2.5"
                            />
                        </div>


                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            {/* Sequence */}
                            <div>
                                <label className="mb-1 block text-xs font-bold">
                                    Display Order
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    value={sequence}
                                    onChange={(event) =>
                                        setSequence(
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-[var(--color-border-default)] px-3 py-2.5"
                                />
                            </div>


                            {/* Downloadable */}
                            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3">
                                <input
                                    type="checkbox"
                                    checked={isDownloadable}
                                    onChange={(event) =>
                                        setIsDownloadable(
                                            event.target.checked
                                        )
                                    }
                                    className="h-4 w-4"
                                />

                                <div>
                                    <div className="text-xs font-bold">
                                        Downloadable
                                    </div>

                                    <div className="text-[10px] text-[var(--color-text-muted)]">
                                        Show Open / Download to Fellows.
                                    </div>
                                </div>
                            </label>

                        </div>
                    </div>


                    <div className="mt-4 flex justify-end gap-2">
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-lg border border-[var(--color-border-default)] px-3 py-2 text-xs font-bold"
                            >
                                Cancel Edit
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={
                                saving ||
                                !title.trim() ||
                                !url.trim()
                            }
                            className="rounded-lg bg-[var(--color-brand-blue)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Update Resource"
                                    : "Add Resource"}
                        </button>
                    </div>
                </form>


                {/* Existing Resources */}
                <div className="mt-6">
                    <h4 className="mb-3 text-sm font-bold">
                        Existing Resources
                    </h4>

                    {loading ? (
                        <div className="rounded-xl border border-[var(--color-border-default)] p-6 text-center text-xs text-[var(--color-text-muted)]">
                            Loading resources...
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="rounded-xl border border-[var(--color-border-default)] p-6 text-center text-xs text-[var(--color-text-muted)]">
                            No challenge resources added yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {resources.map(
                                (resource) => (
                                    <div
                                        key={resource.id}
                                        className="flex flex-col gap-3 rounded-xl border border-[var(--color-border-default)] p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-subtle)]">
                                                <FileText className="h-4 w-4 text-[var(--color-brand-blue)]" />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="break-words text-sm font-bold">
                                                    {resource.title}
                                                </div>

                                                <div className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                                                    Order {resource.sequence}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 gap-2">

                                            {resource.url && (
                                                <a
                                                    href={resource.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-default)] px-3 py-2 text-xs font-bold"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    Open
                                                </a>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    startEdit(resource)
                                                }
                                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-default)] px-3 py-2 text-xs font-bold"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(
                                                        resource.id
                                                    )
                                                }
                                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </button>

                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>


                {/* Footer */}
                <div className="mt-6 flex justify-end border-t border-[var(--color-border-default)] pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-[var(--color-border-default)] px-4 py-2 text-xs font-bold"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
}
