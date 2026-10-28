"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Building2,
  Calendar,
  Clock,
  ChevronRight,
  Video,
  ArrowLeft,
  Crown,
  Mail,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Layout,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMentorTeam, getTeamSessions } from "@/lib/api/mentor";
import type { MentorTeamSummary, SessionSummary } from "@/lib/api/types";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = (params?.teamId as string) || "";

  const [team, setTeam] = React.useState<MentorTeamSummary | null>(null);
  const [sessions, setSessions] = React.useState<SessionSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!teamId || teamId === "undefined") {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([getMentorTeam(teamId), getTeamSessions(teamId)])
      .then(([teamData, sessionRes]) => {
        setTeam(teamData);
        setSessions(sessionRes.sessions || []);
      })
      .catch((err: unknown) => {
        console.error("Failed to load team details:", err);
        setError(err instanceof Error ? err.message : "Failed to load team details.");
      })
      .finally(() => setLoading(false));
  }, [teamId]);

  return (
    <PortalShell
      breadcrumbItems={["My Teams", team ? team.name : "Team Details"]}
    >
      <div className="space-y-6">
        {/* Back navigation */}
        <div>
          <Link
            href="/teams"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to My Teams
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-[var(--color-text-muted)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand-orange)]" />
            Loading team details...
          </div>
        ) : !team ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-12 text-center">
            <Users className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Team Not Found</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              The team you are looking for does not exist or you do not have permission to view it.
            </p>
          </div>
        ) : (
          <>
            {/* Team Overview Card */}
            <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-orange-subtle)] text-[var(--color-brand-orange)] font-extrabold text-xl select-none">
                    {team.name[0]}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[var(--color-navy)]">{team.name}</h1>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {team.company_name && (
                        <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)]">
                          <Building2 className="h-3.5 w-3.5" />
                          {team.company_name}
                        </span>
                      )}
                      <Badge variant="muted" size="sm">
                        {team.cohort.name}
                      </Badge>
                      {team.current_phase && (
                        <Badge variant="brand" size="sm">
                          {team.current_phase.name} ({team.current_phase.code})
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Action Links */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Link href={`/checklist-review?teamId=${team.id}`}>
                    <Button variant="primary" size="sm" className="gap-1.5 text-xs">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Checklist Review
                    </Button>
                  </Link>
                  <Link href={`/working-board?teamId=${team.id}`}>
                    <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                      <Layout className="h-3.5 w-3.5" />
                      Working Board
                    </Button>
                  </Link>
                  <Link href={`/working-board-insights?teamId=${team.id}`}>
                    <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                      <FileText className="h-3.5 w-3.5" />
                      Mentor Insights
                    </Button>
                  </Link>
                  <Link href={`/teams/${team.id}/phase-gate`}>
                    <Button variant="secondary" size="sm" className="gap-1.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-50">
                      <ClipboardList className="h-3.5 w-3.5" />
                      DISCOVER Gate Review
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Company Challenge */}
              {team.company_challenge && (
                <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-orange)]">
                    Company Challenge
                  </div>
                  <p className="text-xs text-[var(--color-navy)] mt-1 leading-relaxed">
                    {team.company_challenge}
                  </p>
                </div>
              )}
            </div>

            {/* Team Members */}
            <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--color-navy)]">
                  Fellows & Team Members ({team.member_count})
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--color-border-default)] p-3 bg-gray-50/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-orange-subtle)] text-xs font-bold text-[var(--color-brand-orange)] select-none">
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[var(--color-navy)] truncate">
                          {member.first_name} {member.last_name}
                        </span>
                        {member.team_role === "lead" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Crown className="h-2.5 w-2.5 text-amber-500" />
                            Lead
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum Sessions */}
            <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--color-navy)]">
                  Sessions & Deliverables ({sessions.length})
                </h2>
              </div>

              {sessions.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] italic py-4">
                  No sessions scheduled for this cohort yet.
                </p>
              ) : (
                <div className="divide-y divide-[var(--color-border-default)]">
                  {sessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/teams/${teamId}/sessions/${session.id}`}
                      className="py-3 px-3 -mx-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[var(--color-bg-subtle,#f8fafc)] transition-all group cursor-pointer border border-transparent hover:border-[var(--color-border-default,#e2e8f0)]"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--color-navy)] group-hover:text-[var(--color-brand-orange)] transition-colors">
                            Session {session.session_number}:
                          </span>
                          <span className="text-xs text-[var(--color-text-body)] group-hover:text-[var(--color-text-primary)] transition-colors">
                            {session.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                          {session.week_title && (
                            <span>{session.week_title}</span>
                          )}
                          {session.start_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(session.start_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            session.status === "completed"
                              ? "success"
                              : session.status === "live"
                                ? "brand"
                                : "muted"
                          }
                          size="sm"
                        >
                          {session.status}
                        </Badge>
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--color-brand-orange)] opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                          View Session
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}
