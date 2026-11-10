"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  User,
  ShieldCheck,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import {
  getMentorTeams,
  getTeamChecklist,
  getChecklistFeedback,
  postChecklistFeedback,
} from "@/lib/api/mentor";
import type {
  MentorTeamSummary,
  MentorChecklistItem,
  ChecklistFeedbackMessage,
} from "@/lib/api/types";
import { useAuth } from "@/lib/auth-context";
import {
  mentorDraftKey,
  saveExpiringDraft,
  loadExpiringDraft,
  removeDraft,
} from "@/lib/auth/drafts";

function ChecklistFeedbackContent() {
  const searchParams = useSearchParams();
  const teamIdParam = searchParams.get("teamId");
  const itemIdParam = searchParams.get("itemId");
  const fellowIdParam = searchParams.get("fellowId");
  const { user } = useAuth();

  const [teams, setTeams] = React.useState<MentorTeamSummary[]>([]);
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>(teamIdParam ?? "");
  const [items, setItems] = React.useState<MentorChecklistItem[]>([]);
  const [selectedItemId, setSelectedItemId] = React.useState<string>("");
  const [messages, setMessages] = React.useState<ChecklistFeedbackMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingThread, setLoadingThread] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [newMessage, setNewMessage] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const currentDraftKey = React.useMemo(() => {
    if (!selectedItemId) return null;
    return mentorDraftKey(user?.id, "feedback-msg", selectedTeamId, selectedItemId);
  }, [user?.id, selectedTeamId, selectedItemId]);

  React.useEffect(() => {
    if (!currentDraftKey || typeof window === "undefined") return;
    const saved = loadExpiringDraft<{ message: string }>(window.sessionStorage, currentDraftKey);
    setNewMessage(saved?.message ?? "");
  }, [currentDraftKey]);

  const handleMessageChange = (text: string) => {
    setNewMessage(text);
    if (currentDraftKey && typeof window !== "undefined") {
      if (text.trim()) {
        saveExpiringDraft(window.sessionStorage, currentDraftKey, { message: text });
      } else {
        removeDraft(window.sessionStorage, currentDraftKey);
      }
    }
  };

  // Load teams then items
  React.useEffect(() => {
    getMentorTeams()
      .then((ts) => {
        setTeams(ts);
        if (ts.length > 0) {
          const firstTeam = ts.find((team) => team.id === teamIdParam) ?? ts[0];
          setSelectedTeamId(firstTeam.id);
          return getTeamChecklist(firstTeam.id);
        }
        return Promise.resolve([]);
      })
      .then((its) => {
        setItems(its);
        const requestedItem = its.find(
          (item) =>
            item.checklist_item_id === itemIdParam &&
            (!fellowIdParam || item.fellow_id === fellowIdParam)
        );
        if (its.length > 0) setSelectedItemId(requestedItem?.id ?? its[0].id);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Unable to load data.")
      )
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload items when team changes
  React.useEffect(() => {
    if (!selectedTeamId) return;
    getTeamChecklist(selectedTeamId)
      .then((its) => {
        setItems(its);
        if (its.length > 0 && !its.find((i) => i.id === selectedItemId)) {
          setSelectedItemId(its[0].id);
        }
      })
      .catch(() => setItems([]));
  }, [selectedTeamId]);

  // Load thread for selected item
  const loadThread = React.useCallback(async (rowId: string, silent = false) => {
    const selectedItem = items.find((item) => item.id === rowId);
    if (!selectedItem) return;
    if (!silent) setLoadingThread(true);
    try {
      const thread = await getChecklistFeedback(
        selectedItem.team_id,
        selectedItem.checklist_item_id,
        selectedItem.fellow_id
      );
      setMessages(thread.messages ?? []);
    } catch {
      setMessages([]);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, [items]);

  React.useEffect(() => {
    if (selectedItemId) void loadThread(selectedItemId);
  }, [selectedItemId, loadThread]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const currentItem = items.find((i) => i.id === selectedItemId) ?? null;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!currentItem || !newMessage.trim()) return;
    setSending(true);
    try {
      const posted = await postChecklistFeedback(
        currentItem.team_id,
        currentItem.checklist_item_id,
        currentItem.fellow_id,
        newMessage.trim()
      );
      if (currentDraftKey && typeof window !== "undefined") {
        removeDraft(window.sessionStorage, currentDraftKey);
      }
      setMessages((prev) => [...prev, posted]);
      setNewMessage("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  const reviewStatus = (currentItem?.review_status ?? "not_checked").toLowerCase();

  return (
    <PortalShell breadcrumbItems={["Checklist Feedback"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">
              Checklist Feedback
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-2xl">
              Discuss checklist items with fellows here. These are separate from review decisions — use Checklist Review to accept or reject.
            </p>
          </div>
          {selectedItemId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void loadThread(selectedItemId, true)}
              disabled={loadingThread}
              className="self-start sm:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingThread ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
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

        {/* Team + Item Selectors */}
        {!loading && teams.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-[var(--color-text-muted)] shrink-0">Team:</span>
              {teams.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTeamId(t.id)}
                  className={`rounded-full px-3 py-1 font-semibold transition-colors shrink-0 ${
                    t.id === selectedTeamId
                      ? "bg-[var(--color-brand-orange)] text-white shadow-xs"
                      : "border border-[var(--color-border-default)] bg-white text-[var(--color-text-body)] hover:border-orange-200"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
            {items.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="font-bold text-[var(--color-text-muted)] shrink-0">Item:</span>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`truncate max-w-[200px] rounded-full px-3 py-1 font-semibold transition-colors shrink-0 ${
                      item.id === selectedItemId
                        ? "bg-[var(--color-brand-navy)] text-white shadow-xs"
                        : "border border-[var(--color-border-default)] bg-white text-[var(--color-text-body)] hover:border-gray-300"
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Item Details */}
          <div className="lg:col-span-5 space-y-4">
            {currentItem ? (
              <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-5 space-y-4 shadow-xs">
                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {currentItem.session_name && (
                    <span className="text-[var(--color-brand-orange)]">{currentItem.session_name}</span>
                  )}
                  {currentItem.category && <span>• {currentItem.category}</span>}
                  {currentItem.is_required && (
                    <span className="rounded-full bg-[var(--color-brand-orange-subtle)] px-2 py-0.5 text-[var(--color-brand-orange)]">
                      Required
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {currentItem.title}
                  </h2>
                  {currentItem.description && (
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-body)]">
                      {currentItem.description}
                    </p>
                  )}
                </div>

                {/* Fellow info */}
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <User className="h-3.5 w-3.5" />
                  <span>{currentItem.fellow_name}</span>
                  <span>·</span>
                  <span>{currentItem.team_name}</span>
                </div>

                {/* Review Status */}
                <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--color-text-muted)]">Review Decision</span>
                    {reviewStatus === "accepted" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
                      </span>
                    ) : reviewStatus === "rejected" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold text-[11px]">
                        <XCircle className="h-3.5 w-3.5" /> Rejected
                      </span>
                    ) : reviewStatus === "pending_review" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                        <Clock className="h-3.5 w-3.5" /> Pending
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                        Not Checked
                      </span>
                    )}
                  </div>
                  {reviewStatus === "rejected" && currentItem.rejection_reason && (
                    <div className="pt-2 border-t border-red-100 text-xs text-red-800 space-y-1">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-red-600">
                        Rejection Reason:
                      </span>
                      <p className="leading-relaxed whitespace-pre-wrap">{currentItem.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {/* Goto review */}
                <Link
                  href={`/checklist-review?teamId=${currentItem.team_id}`}
                  className="text-xs font-semibold text-[var(--color-brand-orange)] hover:underline"
                >
                  → Go to Checklist Review to change decision
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--color-border-default)] p-8 text-center text-xs text-[var(--color-text-muted)] bg-white">
                {loading ? "Loading..." : "Select an item to view details."}
              </div>
            )}
          </div>

          {/* Right: Conversation */}
          <div className="lg:col-span-7 flex flex-col h-[min(600px,70vh)] rounded-2xl border border-[var(--color-border-default)] bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-5 py-3.5 bg-gradient-to-r from-orange-50/40 to-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[var(--color-brand-orange)]" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Discussion Thread</h3>
              </div>
              <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                {messages.length} message{messages.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[var(--color-bg-canvas)]/50">
              {loadingThread ? (
                <div className="flex min-h-[200px] items-center justify-center text-xs text-[var(--color-text-muted)]">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-[var(--color-brand-orange)]" />
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-[var(--color-brand-orange)]">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">No messages yet</h4>
                  <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                    Start the discussion with the fellow. Ask for clarification or provide guidance below.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelf = user?.id === msg.author_user_id;
                  const isFellow = msg.author_role?.toLowerCase() === "fellow" || msg.author_role?.toLowerCase() === "student";

                  return (
                    <div key={msg.id} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-[var(--color-text-muted)]">
                        {isFellow ? (
                          <span className="font-semibold text-[var(--color-text-body)]">
                            {msg.author_name || "Fellow"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-[var(--color-brand-blue)] bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            {isSelf ? "You (Mentor)" : msg.author_name || "Mentor"}
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          isSelf
                            ? "bg-[var(--color-brand-navy)] text-white rounded-tr-xs"
                            : "bg-white border border-[var(--color-border-default)] shadow-xs text-[var(--color-text-primary)] rounded-tl-xs"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="border-t border-[var(--color-border-default)] p-3 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder="Send a message to the fellow..."
                disabled={sending || !selectedItemId}
                className="flex-1 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-orange)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-orange)] disabled:opacity-60"
              />
              <Button
                type="submit"
                size="sm"
                disabled={sending || !newMessage.trim() || !selectedItemId}
                className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-hover)] text-white shrink-0 px-4"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Send
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

export default function ChecklistFeedbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-orange)]" />
        </div>
      }
    >
      <ChecklistFeedbackContent />
    </React.Suspense>
  );
}
