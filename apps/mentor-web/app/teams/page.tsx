"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building2,
  Mail,
  Crown,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Badge } from "@/components/ui/badge";
import { getMentorTeams } from "@/lib/api/mentor";
import type { MentorTeamSummary } from "@/lib/api/types";

export default function TeamsPage() {
  const [teams, setTeams] = React.useState<MentorTeamSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getMentorTeams()
      .then(setTeams)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Unable to load teams.")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalShell breadcrumbItems={["My Teams"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">My Teams</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Your assigned fellowship teams and their members.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-12 text-xs text-[var(--color-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading teams...
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-12 text-center">
            <Users className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">No teams assigned</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Contact your Program Manager to get assigned to a team.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => {
              const lead = team.members.find((m) => m.team_role === "lead");
              return (
                <div
                  key={team.id}
                  className="rounded-2xl border border-[var(--color-border-default)] bg-white shadow-xs overflow-hidden"
                >
                  {/* Team Header */}
                  <div className="flex items-start justify-between gap-4 p-5 border-b border-[var(--color-border-default)] bg-gradient-to-r from-orange-50/30 to-white">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-orange-subtle)] text-[var(--color-brand-orange)] font-bold text-base select-none">
                        {team.name[0]}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                          {team.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {team.company_name && (
                            <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                              <Building2 className="h-3 w-3" />
                              {team.company_name}
                            </span>
                          )}
                          <Badge variant="muted" size="sm">
                            {team.cohort.name}
                          </Badge>
                          {team.current_phase && (
                            <Badge variant="brand" size="sm">
                              {team.current_phase.code}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/teams/${team.id || (team as any).team_id}`}
                      className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-orange)] hover:underline"
                    >
                      View details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Company Challenge */}
                  {team.company_challenge && (
                    <div className="px-5 py-3 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                        Challenge:
                      </span>
                      <p className="text-xs text-[var(--color-text-body)] mt-0.5 leading-relaxed line-clamp-2">
                        {team.company_challenge}
                      </p>
                    </div>
                  )}

                  {/* Members */}
                  <div className="p-5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                      {team.member_count} Fellow{team.member_count !== 1 ? "s" : ""}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2.5 rounded-lg border border-[var(--color-border-default)] px-3 py-2 bg-[var(--color-bg-surface)]"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand-orange-subtle)] text-[10px] font-bold text-[var(--color-brand-orange)] select-none">
                            {member.first_name[0]}{member.last_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                              {member.first_name} {member.last_name}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                              <Mail className="h-2.5 w-2.5" />
                              <span className="truncate">{member.email}</span>
                            </div>
                          </div>
                          {member.team_role === "lead" && (
                            <span title="Team Lead" className="shrink-0 flex items-center">
                              <Crown className="h-3.5 w-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team Quick Actions */}
                  <div className="flex items-center gap-2 px-5 py-3 bg-[var(--color-bg-surface)] border-t border-[var(--color-border-default)]">
                    <Link
                      href={`/checklist-review?teamId=${team.id}`}
                      className="text-[11px] font-semibold text-[var(--color-brand-orange)] hover:underline"
                    >
                      Checklist Review →
                    </Link>
                    <span className="text-[var(--color-border-strong)]">|</span>
                    <Link
                      href={`/working-board?teamId=${team.id}`}
                      className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:underline"
                    >
                      Working Board →
                    </Link>
                    <span className="text-[var(--color-border-strong)]">|</span>
                    <Link
                      href={`/working-board-insights?teamId=${team.id}`}
                      className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:underline"
                    >
                      Mentor Insights →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
