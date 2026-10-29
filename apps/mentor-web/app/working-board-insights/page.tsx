"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ExternalLink,
  Users,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Send,
  Save,
  Edit3,
  Layout,
  HelpCircle,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getMentorTeams,
  getTeamSessions,
  getMentorWorkingBoards,
  getMentorWorkingBoardInsights,
  upsertMentorWorkingBoardInsights,
  publishMentorWorkingBoardInsights,
} from "@/lib/api/mentor";
import type {
  MentorTeamSummary,
  SessionSummary,
  MentorWorkingBoardSummary,
  MentorWorkingBoardInsightsDetail,
} from "@/lib/api/types";
import { useAuth } from "@/lib/auth-context";
import {
  mentorDraftKey,
  saveExpiringDraft,
  loadExpiringDraft,
  removeDraft,
} from "@/lib/auth/drafts";

export default function MentorWorkingBoardInsightsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const teamParam = searchParams.get("teamId");
  const sessionParam = searchParams.get("sessionId");
  const boardParam = searchParams.get("boardId");
  const { user } = useAuth();

  const [teams, setTeams] = React.useState<MentorTeamSummary[]>([]);
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>(teamParam ?? "");
  const [sessions, setSessions] = React.useState<SessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = React.useState<string>(sessionParam ?? "");
  const [workingBoards, setWorkingBoards] = React.useState<MentorWorkingBoardSummary[]>([]);
  const [currentBoard, setCurrentBoard] = React.useState<MentorWorkingBoardSummary | null>(null);

  // Insights State
  const [insights, setInsights] = React.useState<MentorWorkingBoardInsightsDetail | null>(null);
  const [insightsText, setInsightsText] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);

  // Loading & status states
  const [loadingTeams, setLoadingTeams] = React.useState(true);
  const [loadingSessions, setLoadingSessions] = React.useState(false);
  const [loadingBoards, setLoadingBoards] = React.useState(false);
  const [loadingInsights, setLoadingInsights] = React.useState(false);
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  const [statusMessage, setStatusMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insightsDraftKey = React.useMemo(() => {
    if (!currentBoard) return null;
    return mentorDraftKey(user?.id, "insights", currentBoard.id);
  }, [user?.id, currentBoard]);

  const handleInsightsTextChange = (text: string) => {
    setInsightsText(text);
    if (insightsDraftKey && typeof window !== "undefined") {
      if (text.trim()) {
        saveExpiringDraft(window.sessionStorage, insightsDraftKey, { text });
      } else {
        removeDraft(window.sessionStorage, insightsDraftKey);
      }
    }
  };

  // 1. Load mentor's teams
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
        setStatusMessage({
          type: "error",
          text: "Could not load assigned teams. Please refresh.",
        });
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
    try {
      const data = await getMentorWorkingBoards(undefined, teamId);
      setWorkingBoards(data);
    } catch (err: unknown) {
      console.error("Failed to load working boards:", err);
    } finally {
      setLoadingBoards(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedTeamId) {
      void loadBoards(selectedTeamId);
    }
  }, [selectedTeamId, loadBoards]);

  // 4. Determine current board based on selectedSessionId or boardParam
  React.useEffect(() => {
    if (workingBoards.length === 0) {
      setCurrentBoard(null);
      return;
    }
    if (boardParam) {
      const match = workingBoards.find((b) => b.id === boardParam);
      if (match) {
        setCurrentBoard(match);
        return;
      }
    }
    const match = workingBoards.find(
      (b) => b.team_id === selectedTeamId && b.session_id === selectedSessionId
    );
    setCurrentBoard(match || null);
  }, [workingBoards, selectedTeamId, selectedSessionId, boardParam]);

  // 5. Load insights for current board
  const loadBoardInsights = React.useCallback(
    async (boardId: string) => {
      setLoadingInsights(true);
      setStatusMessage(null);
      try {
        const data = await getMentorWorkingBoardInsights(boardId);
        setInsights(data);
        if (data) {
          setInsightsText(data.insights_text);
          setIsEditing(false);
        } else {
          // No server insights yet — restore from sessionStorage draft if present
          const draftKey = mentorDraftKey(user?.id, "insights", boardId);
          if (typeof window !== "undefined") {
            const saved = loadExpiringDraft<{ text: string }>(window.sessionStorage, draftKey);
            setInsightsText(saved?.text ?? "");
          } else {
            setInsightsText("");
          }
          setIsEditing(true);
        }
      } catch (err: unknown) {
        console.error("Failed to load Mentor Insights:", err);
        setStatusMessage({
          type: "error",
          text: "Failed to load existing insights for this working board.",
        });
      } finally {
        setLoadingInsights(false);
      }
    },
    [user?.id],
  );

  React.useEffect(() => {
    if (currentBoard && currentBoard.is_published) {
      void loadBoardInsights(currentBoard.id);
    } else {
      setInsights(null);
      setInsightsText("");
      setIsEditing(false);
    }
  }, [currentBoard, loadBoardInsights]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  function handleTeamChange(teamId: string) {
    setSelectedTeamId(teamId);
    setStatusMessage(null);
    router.replace(`/working-board-insights?teamId=${teamId}`);
  }

  function handleSessionChange(sessionId: string) {
    setSelectedSessionId(sessionId);
    setStatusMessage(null);
    router.replace(`/working-board-insights?teamId=${selectedTeamId}&sessionId=${sessionId}`);
  }

  // Insert fellow name into textarea at cursor or end
  function insertFellowName(name: string) {
    const snippet = `\n${name}:\n`;
    const next = insightsText.trim() ? `${insightsText.trimEnd()}${snippet}` : `${name}:\n`;
    handleInsightsTextChange(next);
    if (!isEditing) setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }, 50);
  }

  // Action: Save Draft
  async function handleSaveDraft() {
    if (!currentBoard) return;
    const text = insightsText.trim();
    if (!text) {
      setStatusMessage({
        type: "error",
        text: "Please enter your observations before saving a draft.",
      });
      return;
    }

    setSavingDraft(true);
    setStatusMessage(null);
    try {
      const res = await upsertMentorWorkingBoardInsights(currentBoard.id, {
        insights_text: text,
        publication_status: "draft",
      });
      setInsights(res);
      setStatusMessage({
        type: "success",
        text: "Draft saved successfully. Draft insights are not visible to fellows until published.",
      });
      // Clear sessionStorage draft — content is now persisted on the server
      if (insightsDraftKey && typeof window !== "undefined") {
        removeDraft(window.sessionStorage, insightsDraftKey);
      }
      setIsEditing(false);
    } catch (err: unknown) {
      console.error("Failed to save draft insights:", err);
      setStatusMessage({
        type: "error",
        text: "Failed to save draft. Please try again.",
      });
    } finally {
      setSavingDraft(false);
    }
  }

  // Action: Publish Insights
  async function handlePublish() {
    if (!currentBoard) return;
    const text = insightsText.trim();
    if (!text) {
      setStatusMessage({
        type: "error",
        text: "Please enter your observations before publishing.",
      });
      return;
    }

    setPublishing(true);
    setStatusMessage(null);
    try {
      // First persist text with publish status
      await upsertMentorWorkingBoardInsights(currentBoard.id, {
        insights_text: text,
        publication_status: "published",
      });
      const published = await publishMentorWorkingBoardInsights(currentBoard.id);
      setInsights(published);
      setStatusMessage({
        type: "success",
        text: "Mentor Insights published successfully! Fellows can now view these observations.",
      });
      // Clear sessionStorage draft — content is now published on the server
      if (insightsDraftKey && typeof window !== "undefined") {
        removeDraft(window.sessionStorage, insightsDraftKey);
      }
      setIsEditing(false);
    } catch (err: unknown) {
      console.error("Failed to publish insights:", err);
      setStatusMessage({
        type: "error",
        text: "Failed to publish insights. Please try again.",
      });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <PortalShell breadcrumbItems={["Mentor Insights"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-navy)]">
              Mentor Insights
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Provide your observations on the team&apos;s Working Board. Mention each fellow by name wherever specific feedback applies.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (currentBoard) void loadBoardInsights(currentBoard.id);
            }}
            disabled={loadingInsights || loadingBoards}
            className="self-start sm:self-auto text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingInsights ? "animate-spin text-[var(--color-brand-orange)]" : ""}`} />
            Refresh
          </Button>
        </div>

        {statusMessage && (
          <div
            role="alert"
            className={`flex items-center gap-2 rounded-xl border p-4 text-xs font-medium ${statusMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
              }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Selectors Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-xs">
          {/* Team Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Assigned Team
            </label>
            {loadingTeams ? (
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] py-2">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-brand-orange)]" />
                Loading teams...
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
              Session & Week
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

        {/* Working Board Reference Banner */}
        {currentBoard && currentBoard.is_published ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="brand" size="sm">
                  {currentBoard.team_name}
                </Badge>
                {currentBoard.week_number && (
                  <Badge variant="muted" size="sm">
                    Week {currentBoard.week_number}
                  </Badge>
                )}
                <span className="text-xs font-bold text-[var(--color-navy)] truncate">
                  {currentBoard.title}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] truncate">
                Session: {currentBoard.session_title}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={currentBoard.working_board_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-brand-blue)] px-4 py-2 text-xs font-bold text-white hover:opacity-95 transition-all"
              >
                <span>Open Working Board</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <Link href={`/working-board?teamId=${selectedTeamId}&sessionId=${selectedSessionId}`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  View Board Info
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-8 text-center shadow-xs space-y-2">
            <Layout className="h-8 w-8 text-[var(--color-text-muted)] mx-auto opacity-60" />
            <h2 className="text-sm font-bold text-[var(--color-navy)]">
              No Published Working Board
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
              A published Working Board from the Admin is required before providing observations.
            </p>
          </div>
        )}

        {/* Mentor Insights Editor Area */}
        {currentBoard && currentBoard.is_published && (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-white overflow-hidden shadow-xs">
            {/* Card Header & Status */}
            <div className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--color-navy)]">
                  Mentor Insights
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Write team-level and fellow-specific feedback in the area below.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {insights ? (
                  insights.publication_status === "published" ? (
                    <Badge variant="success" size="sm" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Published
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm" className="gap-1">
                      <Clock className="h-3 w-3" /> Draft (Unpublished)
                    </Badge>
                  )
                ) : (
                  <Badge variant="muted" size="sm">
                    Not Started
                  </Badge>
                )}

                {insights && (
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {insights.published_at
                      ? `Published ${new Date(insights.published_at).toLocaleString()}`
                      : `Updated ${new Date(insights.updated_at).toLocaleString()}`}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Fellow Name Reference Chips */}
              {selectedTeam && selectedTeam.members && selectedTeam.members.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[var(--color-brand-orange)]" />
                      Team Fellows (Click name to insert mention):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeam.members.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => insertFellowName(`${member.first_name} ${member.last_name}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2.5 py-1 text-xs text-[var(--color-navy)] hover:border-[var(--color-brand-orange)] hover:text-[var(--color-brand-orange)] transition-colors cursor-pointer select-none"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-orange)]" />
                        <span className="font-semibold">{member.first_name} {member.last_name}</span>
                        {member.team_role === "lead" && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 rounded">Lead</span>
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => insertFellowName("Team")}
                      className="inline-flex items-center gap-1 rounded-lg border border-dashed border-[var(--color-border-strong)] px-2.5 py-1 text-xs font-bold text-[var(--color-brand-blue)] hover:bg-blue-50 transition-colors cursor-pointer select-none"
                    >
                      + Team Overview
                    </button>
                  </div>
                </div>
              )}

              {/* Text Area or Read-only Display */}
              {loadingInsights ? (
                <div className="flex items-center justify-center gap-2 py-12 text-xs text-[var(--color-text-muted)]">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand-orange)]" />
                  Loading existing observations...
                </div>
              ) : isEditing || !insights ? (
                <div className="space-y-2">
                  <label
                    htmlFor="insights-editor"
                    className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
                  >
                    Mentor Insights
                  </label>
                  <textarea
                    id="insights-editor"
                    ref={textareaRef}
                    rows={12}
                    value={insightsText}
                    onChange={(e) => handleInsightsTextChange(e.target.value)}
                    placeholder="Enter your observations on the team's Working Board. Mention each fellow by name wherever specific feedback applies."
                    className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 text-sm text-[var(--color-navy)] leading-relaxed outline-none focus:border-[var(--color-brand-blue)] resize-y"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                    <span>
                      Example: Fellow A: Great market research. Fellow B: Needs financial model depth. Team: Review assumptions.
                    </span>
                    <span>{insightsText.length} characters</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Current Published Observations
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-1.5 text-xs"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit Insights
                    </Button>
                  </div>
                  <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 text-sm text-[var(--color-navy)] whitespace-pre-wrap leading-relaxed">
                    {insights.insights_text}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-[var(--color-border-default)] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-[var(--color-text-muted)]">
                  Drafts are private to mentors. Published insights are immediately visible to team fellows.
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  {isEditing && insights && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setInsightsText(insights.insights_text);
                        setIsEditing(false);
                      }}
                      disabled={savingDraft || publishing}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveDraft}
                    disabled={savingDraft || publishing || !insightsText.trim()}
                    className="gap-1.5 text-xs"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {savingDraft ? "Saving Draft..." : "Save Draft"}
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePublish}
                    disabled={savingDraft || publishing || !insightsText.trim()}
                    className="gap-1.5 text-xs bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {publishing ? "Publishing..." : "Publish Insights"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
