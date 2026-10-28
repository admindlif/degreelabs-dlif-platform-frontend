"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Video,
  ExternalLink,
  Users,
  Layers,
  FileText,
  ClipboardCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Building2,
  Bookmark,
  Lock,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMentorTeamSession } from "@/lib/api/mentor";
import type { MentorSessionDetail } from "@/lib/api/types";

export default function MentorSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = (params?.teamId as string) || "";
  const sessionId = (params?.sessionId as string) || "";

  const [session, setSession] = React.useState<MentorSessionDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSession = React.useCallback(() => {
    if (!teamId || teamId === "undefined" || !sessionId || sessionId === "undefined") {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getMentorTeamSession(teamId, sessionId)
      .then((data) => {
        setSession(data);
      })
      .catch((err: unknown) => {
        console.error("Failed to load mentor session details:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load session details or you are not authorized to view this session."
        );
      })
      .finally(() => setLoading(false));
  }, [teamId, sessionId]);

  React.useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const currentTime = Date.now();
  const sessionHasEnded =
    session?.status === "completed" ||
    (!!session?.end_at && new Date(session.end_at).getTime() < currentTime);

  return (
    <PortalShell
      breadcrumbItems={[
        "My Teams",
        session?.team_name || "Team",
        session ? `Session ${session.session_number}` : "Session Details",
      ]}
    >
      <div className="space-y-6">
        {/* Back navigation */}
        <div>
          <Link
            href={`/teams/${teamId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {session?.team_name || "Team Details"}
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-bold text-red-800">Unable to Load Session</h2>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button size="sm" onClick={fetchSession}>
                Retry
              </Button>
              <Link href={`/teams/${teamId}`}>
                <Button variant="secondary" size="sm">
                  Return to Team
                </Button>
              </Link>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-12 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand-orange)]" />
              Loading session details...
            </div>
          </div>
        ) : !session ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-12 text-center space-y-3">
            <Calendar className="h-10 w-10 text-[var(--color-text-muted)] mx-auto" />
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              Session Not Found
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
              This session does not exist, is locked, or you do not have permission to view it for this team.
            </p>
            <div className="pt-2">
              <Link href={`/teams/${teamId}`}>
                <Button variant="secondary" size="sm">
                  Back to Team
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Session Header Card (matches Fellow Portal Option B design) */}
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white shadow-xs">
              <div className="p-6 sm:p-8 space-y-4 border-b border-[var(--color-border-default)] bg-gradient-to-r from-orange-50/20 via-white to-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-brand-orange)]">
                    Session {session.session_number}
                  </div>
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
                    {session.status.toUpperCase()}
                  </Badge>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] break-words">
                  {session.title}
                </h1>

                {session.description && (
                  <p className="text-sm text-[var(--color-text-body,#475569)] leading-relaxed">
                    {session.description}
                  </p>
                )}

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[var(--color-text-muted)]">
                  {session.cohort_name && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                      <Bookmark className="h-3 w-3 text-gray-500" />
                      Cohort: {session.cohort_name}
                    </span>
                  )}

                  {session.team_name && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[var(--color-brand-orange)] font-semibold">
                      <Users className="h-3 w-3" />
                      Team: {session.team_name}
                    </span>
                  )}

                  {session.phase_name && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-medium">
                      <Layers className="h-3 w-3 text-blue-500" />
                      {session.phase_name}
                    </span>
                  )}

                  {session.week_title && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                      {session.week_title}
                    </span>
                  )}
                </div>
              </div>

              {/* Schedule and Details Sub-bar */}
              <div className="px-6 py-4 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--color-text-muted)]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--color-brand-orange)]" />
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {session.start_at
                      ? new Date(session.start_at).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Schedule TBA"}
                  </span>
                </div>

                {session.start_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
                    <span>
                      {new Date(session.start_at).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {session.end_at && (
                        <>
                          {" - "}
                          {new Date(session.end_at).toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Session Details & Meeting Card */}
            <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Session Details
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Review the session schedule and join the live meeting configured by DegreeLabs.
                </p>
              </div>

              {/* Live Meeting Join Action */}
              {sessionHasEnded ? (
                <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas,#f9fafb)] p-5 space-y-1">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Session completed
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    This session has already ended. You can no longer join this meeting.
                  </p>
                </div>
              ) : !session.is_unlocked ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/20 p-5 space-y-1">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-sm font-semibold text-amber-900">Session Not Yet Unlocked</p>
                  </div>
                  <p className="text-xs text-amber-700 pl-6">
                    This session is scheduled for a future date. The meeting link and full details will be available once DegreeLabs unlocks this session.
                  </p>
                </div>
              ) : session.meeting_url ? (
                <div className="rounded-xl border border-orange-200/60 bg-orange-50/20 p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[var(--color-text-primary)]">
                        Live Meeting Ready
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {session.meeting_provider
                          ? `Platform: ${session.meeting_provider}`
                          : "Join the interactive video session with fellows and facilitators."}
                      </p>
                    </div>

                    <a
                      href={session.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-orange)] px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-[var(--color-brand-orange-hover,#e05300)] transition-all cursor-pointer select-none"
                    >
                      <Video className="w-4 h-4" />
                      Join Meeting
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  </div>

                  <p className="text-[11px] text-[var(--color-text-muted)] border-t border-orange-100 pt-3">
                    This is the shared live meeting link configured for this cohort. Opens directly in a new browser tab.
                  </p>
                </div>
              ) : !session.start_at ? (
                <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas,#f9fafb)] p-5 text-xs text-[var(--color-text-muted)]">
                  Session schedule will be updated by DegreeLabs.
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas,#f9fafb)] p-5 text-xs text-[var(--color-text-muted)]">
                  Meeting link has not been added yet.
                </div>
              )}
            </div>

            {/* Team Deliverables & Collaboration Quick Links */}
            <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Team Deliverables for Session {session.session_number}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Access your assigned team's collaborative work and deliverables related to this session.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <Link
                  href={`/working-board?teamId=${teamId}`}
                  className="rounded-xl border border-[var(--color-border-default)] p-4 hover:border-[var(--color-brand-orange)] hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-orange)] transition-colors">
                    <FileText className="h-4 w-4 text-[var(--color-brand-orange)]" />
                    Working Board
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    View team collaborative Google Doc
                  </p>
                </Link>

                <Link
                  href={`/working-board-insights?teamId=${teamId}`}
                  className="rounded-xl border border-[var(--color-border-default)] p-4 hover:border-[var(--color-brand-orange)] hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-orange)] transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-blue,#2563eb)]" />
                    Mentor Insights
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    Publish your mentor observations
                  </p>
                </Link>

                <Link
                  href={`/checklist-review?teamId=${teamId}`}
                  className="rounded-xl border border-[var(--color-border-default)] p-4 hover:border-[var(--color-brand-orange)] hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-orange)] transition-colors">
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    Checklist Review
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    Review and accept/reject submissions
                  </p>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}
