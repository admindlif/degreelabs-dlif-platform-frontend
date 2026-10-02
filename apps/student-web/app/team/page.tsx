"use client";

import * as React from "react";
import { AlertCircle, RefreshCw, Users } from "lucide-react";

import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getFellowTeam } from "@/lib/api/toolkit";
import { FellowTeam } from "@/lib/api/types";

async function requestTeam(): Promise<FellowTeam | null> {
    try {
        return await getFellowTeam();
    } catch (error: unknown) {
        if (error instanceof ApiError && error.status === 404) {
            return null;
        }
        throw error;
    }
}

export default function TeamPage() {
    const [team, setTeam] = React.useState<FellowTeam | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const loadTeam = React.useCallback(async () => {
        try {
            setTeam(await requestTeam());
            setError(null);
        } catch {
            setError("Unable to load your team.");
        } finally {
            setLoading(false);
        }
    }, []);

    const retryTeam = React.useCallback(() => {
        setLoading(true);
        setError(null);
        void loadTeam();
    }, [loadTeam]);

    React.useEffect(() => {
        let cancelled = false;

        void requestTeam()
            .then((data) => {
                if (!cancelled) setTeam(data);
            })
            .catch(() => {
                if (!cancelled) setError("Unable to load your team.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <PortalShell
            breadcrumbItems={["My Team"]}
        >
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold">My Team</h1>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        View your Team assignment, challenge, and members.
                    </p>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-muted)]">
                        Loading Team...
                    </div>
                ) : error ? (
                    <div role="alert" className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 font-semibold">
                            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                            Unable to load your team.
                        </div>
                        <Button size="sm" onClick={retryTeam}>
                            <RefreshCw className="h-3.5 w-3.5" />
                            Retry
                        </Button>
                    </div>
                ) : !team ? (
                    <div className="rounded-2xl border border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-muted)]">
                        Team assignment is pending.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white p-5 sm:p-6">
                        <div className="flex min-w-0 items-center gap-3">
                            <Users className="h-6 w-6 shrink-0 text-[var(--color-brand-blue)]" />

                            <div className="min-w-0">
                                <h2 className="truncate text-xl font-bold">
                                    Team {team.name}
                                </h2>

                                <p className="text-xs text-[var(--color-text-muted)]">
                                    {team.member_count} Fellows
                                </p>
                            </div>
                        </div>

                        {team.company_name && (
                            <div className="mt-6">
                                <div className="text-xs font-bold uppercase text-[var(--color-text-muted)]">
                                    Company
                                </div>

                                <div className="font-bold mt-1">
                                    {team.company_name}
                                </div>
                            </div>
                        )}

                        {team.company_challenge && (
                            <div className="mt-4">
                                <div className="text-xs font-bold uppercase text-[var(--color-text-muted)]">
                                    Company Challenge
                                </div>

                                <div className="mt-1">
                                    {team.company_challenge}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 space-y-2">
                            <h3 className="font-bold">
                                Team Members
                            </h3>

                            {team.members.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex flex-col gap-1 rounded-xl bg-[var(--color-bg-subtle)] p-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <span>
                                        {member.first_name} {member.last_name}
                                    </span>

                                    <span className="text-xs capitalize text-[var(--color-text-muted)]">
                                        {member.team_role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </PortalShell>
    );
}
