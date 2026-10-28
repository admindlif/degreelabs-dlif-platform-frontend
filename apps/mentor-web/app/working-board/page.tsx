"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layout,
  ExternalLink,
  Users,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileText,
  ChevronRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getMentorTeams,
  getTeamSessions,
  getMentorWorkingBoards,
} from "@/lib/api/mentor";
import type {
  MentorTeamSummary,
  SessionSummary,
  MentorWorkingBoardSummary,
} from "@/lib/api/types";

export default function MentorWorkingBoardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const teamParam = searchParams.get("teamId");
  const sessionParam = searchParams.get("sessionId");

  const [teams, setTeams] = React.useState<MentorTeamSummary[]>([]);
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>(teamParam ?? "");
  const [sessions, setSessions] = React.useState<SessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = React.useState<string>(sessionParam ?? "");
  const [workingBoards, setWorkingBoards] = React.useState<MentorWorkingBoardSummary[]>([]);

  const [loadingTeams, setLoadingTeams] = React.useState(true);
  const [loadingSessions, setLoadingSessions] = React.useState(false);
  const [loadingBoards, setLoadingBoards] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 1. Load mentor's assigned teams
  React.useEffect(() => {
    setLoadingTeams(true);
    getMentorTeams()
      .then((data) => {
        setTeams(data);
        if (data.length > 0) {
          const initialTeamId = teamParam && data.some((t) => t.id === teamParam)
            ? teamParam
            : data[0].id;
          setSelectedTeamId(initialTeamId);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to load mentor teams:", err);
        setError("Could not load your assigned teams. Please refresh.");
      })
      .finally(() => setLoadingTeams(false));
  }, [teamParam]);

  // 2. Load sessions for selected team
  const loadSessionsForTeam = React.useCallback(async (teamId: string) => {
    if (!teamId) return;
    setLoadingSessions(true);
    try {
      const res = await getTeamSessions(teamId);
      const sessionList = res.sessions || [];
      setSessions(sessionList);
      if (sessionList.length > 0) {
        // If current sessionParam exists in this team's sessions, keep it, otherwise pick first
        setSelectedSessionId((prev) => {
          if (prev && sessionList.some((s) => s.id === prev)) return prev;
          if (sessionParam && sessionList.some((s) => s.id === sessionParam)) return sessionParam;
          return sessionList[0].id;
        });
      } else {
        setSelectedSessionId("");
      }
    } catch (err: unknown) {
      console.error("Failed to load team sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  }, [sessionParam]);

  React.useEffect(() => {
    if (selectedTeamId) {
      void loadSessionsForTeam(selectedTeamId);
    }
  }, [selectedTeamId, loadSessionsForTeam]);

  // 3. Load working boards for selected team
  const loadBoards = React.useCallback(async (teamId: string) => {
    if (!teamId) return;
    setLoadingBoards(true);
    setError(null);
    try {
      const data = await getMentorWorkingBoards(undefined, teamId);
      setWorkingBoards(data);
    } catch (err: unknown) {
      console.error("Failed to load working boards:", err);
      setError("Unable to load Working Boards for this team.");
    } finally {
      setLoadingBoards(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedTeamId) {
      void loadBoards(selectedTeamId);
    }
  }, [selectedTeamId, loadBoards]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const activeBoard = workingBoards.find(
    (b) => b.team_id === selectedTeamId && b.session_id === selectedSessionId
  );

  function handleTeamChange(teamId: string) {
    setSelectedTeamId(teamId);
    router.replace(`/working-board?teamId=${teamId}`);
  }

  function handleSessionChange(sessionId: string) {
    setSelectedSessionId(sessionId);
    router.replace(`/working-board?teamId=${selectedTeamId}&sessionId=${sessionId}`);
  }

  return (
    <PortalShell breadcrumbItems={["Working Board"]}>
      <div className="space-y-6">
        {/* Header & Mentor Instructions */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-navy)]">
              Working Board
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Open the team&apos;s Working Board, review the collaborative work, and provide your observations in Mentor Insights.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (selectedTeamId) void loadBoards(selectedTeamId);
            }}
            disabled={loadingBoards || loadingTeams}
            className="self-start sm:self-auto text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingBoards ? "animate-spin text-[var(--color-brand-orange)]" : ""}`} />
            Refresh
          </Button>
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

        {/* Selectors Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-xs">
          {/* Team Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Select Assigned Team
            </label>
            {loadingTeams ? (
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] py-2">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-brand-orange)]" />
                Loading assigned teams...
              </div>
            ) : (
              <select
                value={selectedTeamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm font-semibold text-[var(--color-navy)] outline-none focus:border-[var(--color-brand-blue)]"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.cohort.name})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Session Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Select Session
            </label>
            {loadingSessions ? (
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] py-2">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-brand-orange)]" />
                Loading sessions...
              </div>
            ) : (
              <select
                value={selectedSessionId}
                onChange={(e) => handleSessionChange(e.target.value)}
                disabled={sessions.length === 0}
                className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm font-semibold text-[var(--color-navy)] outline-none focus:border-[var(--color-brand-blue)]"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Session {s.session_number}: {s.title} {s.week_title ? `(${s.week_title})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Board Content Display */}
        {loadingBoards ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-[var(--color-text-muted)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand-orange)]" />
            Loading Working Board...
          </div>
        ) : !activeBoard || !activeBoard.is_published ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-12 text-center shadow-xs space-y-3">
            <Layout className="h-10 w-10 text-[var(--color-text-muted)] mx-auto opacity-60" />
            <h2 className="text-base font-bold text-[var(--color-navy)]">
              No Published Working Board
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
              The Admin has not published a Working Board for {selectedTeam ? selectedTeam.name : "this team"} in {selectedSession ? selectedSession.title : "this session"} yet.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-white overflow-hidden shadow-xs">
            {/* Context Header */}
            <div className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {activeBoard.cohort_name && (
                      <Badge variant="muted" size="sm">
                        {activeBoard.cohort_name}
                      </Badge>
                    )}
                    <Badge variant="brand" size="sm">
                      {activeBoard.team_name}
                    </Badge>
                    {activeBoard.week_number && (
                      <Badge variant="muted" size="sm">
                        Week {activeBoard.week_number}
                      </Badge>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      Published
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[var(--color-navy)]">
                    {activeBoard.title}
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {activeBoard.session_title}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={activeBoard.working_board_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-blue)] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition-all"
                  >
                    <span>Open Working Board</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <Link
                    href={`/working-board-insights?teamId=${selectedTeamId}&sessionId=${selectedSessionId}&boardId=${activeBoard.id}`}
                  >
                    <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                      <FileText className="h-3.5 w-3.5" />
                      Mentor Insights →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-[var(--color-brand-blue)]" />
                  Admin Instructions for Collaborative Work
                </h3>
                <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 text-xs text-[var(--color-navy)] whitespace-pre-wrap leading-relaxed">
                  {activeBoard.instructions || "No specific instructions provided by the Admin."}
                </div>
              </div>

              {/* Working Board Link Display */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                  Document Link
                </h3>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3 text-xs">
                  <span className="text-[var(--color-navy)] font-mono truncate">
                    {activeBoard.working_board_url}
                  </span>
                  <a
                    href={activeBoard.working_board_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-bold text-[var(--color-brand-blue)] hover:underline inline-flex items-center gap-1"
                  >
                    Open Link <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Team Fellows Reference */}
              {selectedTeam && selectedTeam.members && selectedTeam.members.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[var(--color-brand-orange)]" />
                    Team Fellows ({selectedTeam.members.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeam.members.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-default)] bg-white px-2.5 py-1 text-xs text-[var(--color-navy)]"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-orange)]" />
                        <span className="font-semibold">{m.first_name} {m.last_name}</span>
                        {m.team_role === "lead" && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">Lead</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps for Mentor */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-blue-900 leading-relaxed">
                  <strong>Mentor Observation:</strong> Review the team&apos;s progress in Google Docs, then publish your observations for the fellows.
                </div>
                <Link
                  href={`/working-board-insights?teamId=${selectedTeamId}&sessionId=${selectedSessionId}&boardId=${activeBoard.id}`}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-brand-blue)] hover:underline"
                >
                  Go to Mentor Insights <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
