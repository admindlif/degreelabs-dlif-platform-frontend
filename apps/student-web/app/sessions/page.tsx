"use client";

import * as React from "react";
import {
    Calendar,
    LockKeyhole,
    PlayCircle,
    Video,
} from "lucide-react";

import Link from "next/link";

import { PortalShell } from "@/components/layout/portal-shell";
import { getDiscoverWeeks } from "@/lib/api/discover";

import {
    DiscoverWeek,
    SessionSummary,
} from "@/lib/api/types";

export default function SessionsPage() {
    const [weeks, setWeeks] =
        React.useState<DiscoverWeek[]>([]);

    const [loading, setLoading] =
        React.useState(true);

    const [error, setError] =
        React.useState<string | null>(null);

    React.useEffect(() => {
        getDiscoverWeeks()
            .then(setWeeks)
            .catch((err) => {
                setError(
                    err?.message ||
                    "Unable to load sessions."
                );
            })
            .finally(() => setLoading(false));
    }, []);

    const sessions: SessionSummary[] = weeks.flatMap(
        (week) => week.sessions
    );

    return (
        <PortalShell
            breadcrumbItems={["My Sessions"]}
        >
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold">
                        My Sessions
                    </h1>

                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Access upcoming sessions, meeting links and recordings.
                    </p>
                </div>

                {loading && (
                    <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">
                        Loading sessions...
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!loading && !error && sessions.length === 0 && (
                    <div className="p-8 rounded-2xl border border-[var(--color-border-default)] text-center">
                        No sessions have been scheduled yet.
                    </div>
                )}

                <div className="space-y-4">
                    {sessions.map((session) => {
                        const locked = !session.is_unlocked;

                        return (
                            <div
                                key={session.id}
                                className={`overflow-hidden rounded-2xl border p-5 ${locked
                                    ? "bg-[var(--color-bg-subtle)] border-[var(--color-border-default)]"
                                    : "bg-white border-[var(--color-border-default)]"
                                    }`}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-orange)]">
                                                Session {session.session_number}
                                            </div>

                                            {locked && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-default)] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                                                    <LockKeyhole className="w-3 h-3" />
                                                    Locked
                                                </span>
                                            )}
                                        </div>

                                        <h2
                                            className={`mt-1 break-words text-lg font-bold ${locked
                                                ? "text-[var(--color-text-muted)]"
                                                : ""
                                                }`}
                                        >
                                            {session.title}
                                        </h2>

                                        {locked ? (
                                            <p className="text-sm text-[var(--color-text-muted)] mt-2">
                                                This session has not been unlocked yet.
                                            </p>
                                        ) : (
                                            <>
                                                {session.description && (
                                                    <p className="mt-1 line-clamp-3 break-words text-sm text-[var(--color-text-muted)]">
                                                        {session.description}
                                                    </p>
                                                )}

                                                <div className="flex items-start gap-2 mt-3 text-xs text-[var(--color-text-muted)]">
                                                    <Calendar className="w-4 h-4 shrink-0" />

                                                    {session.start_at
                                                        ? new Date(
                                                            session.start_at
                                                        ).toLocaleString()
                                                        : "Schedule to be announced"}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {locked ? (
                                        <div className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border-default)] px-4 py-2 text-xs font-bold text-[var(--color-text-muted)]">
                                            <LockKeyhole className="w-4 h-4" />
                                            Session Locked
                                        </div>
                                    ) : (
                                        <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
                                            <Link
                                                href={`/sessions/${session.id}`}
                                                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--color-border-default)] px-4 py-2 text-xs font-bold sm:flex-none"
                                            >
                                                View Session
                                            </Link>

                                            {session.meeting_url && (
                                                <a
                                                    href={session.meeting_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-orange)] px-4 py-2 text-xs font-bold text-white sm:flex-none"
                                                >
                                                    <Video className="w-4 h-4" />
                                                    Join Session
                                                </a>
                                            )}

                                            {session.recording_url && (
                                                <a
                                                    href={session.recording_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--color-border-default)] px-4 py-2 text-xs font-bold sm:flex-none"
                                                >
                                                    <PlayCircle className="w-4 h-4" />
                                                    Recording
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </PortalShell>
    );
}
