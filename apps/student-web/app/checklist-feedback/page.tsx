"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  ShieldCheck,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import {
  getChecklistFeedback,
  getFellowChecklist,
  postChecklistFeedback,
} from "@/lib/api/checklist";
import type {
  ChecklistFeedbackMessage,
  FellowChecklistResponse,
} from "@/lib/api/types";
import { useAuth } from "@/lib/auth-context";
import {
  fellowDraftKey,
  loadExpiringDraft,
  removeDraft,
  saveExpiringDraft,
} from "@/lib/auth/drafts";

export default function ChecklistFeedbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const itemIdParam = searchParams.get("itemId");
  const { user } = useAuth();

  const [checklist, setChecklist] = React.useState<FellowChecklistResponse | null>(null);
  const [selectedItemId, setSelectedItemId] = React.useState<string>(itemIdParam || "");
  const [messages, setMessages] = React.useState<ChecklistFeedbackMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingThread, setLoadingThread] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [newMessage, setNewMessage] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Load checklist items to show context and selection
  const loadChecklist = React.useCallback(async () => {
    try {
      const data = await getFellowChecklist();
      setChecklist(data);
      if (!selectedItemId && data.items.length > 0) {
        setSelectedItemId(data.items[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load checklist.");
    } finally {
      setLoading(false);
    }
  }, [selectedItemId]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadChecklist();
  }, [loadChecklist]);

  // Sync with URL param
  React.useEffect(() => {
    if (itemIdParam && itemIdParam !== selectedItemId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedItemId(itemIdParam);
    }
  }, [itemIdParam, selectedItemId]);

  // Load message thread for the selected item
  const loadThread = React.useCallback(async (itemId: string, silent = false) => {
    if (!itemId) return;
    if (!silent) setLoadingThread(true);
    try {
      const thread = await getChecklistFeedback(itemId);
      setMessages(thread.messages || []);
    } catch {
      // If thread doesn't exist yet, start with empty messages
      setMessages([]);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedItemId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadThread(selectedItemId);
      if (typeof window !== "undefined") {
        const draft = loadExpiringDraft<string>(
          window.sessionStorage,
          fellowDraftKey(user?.id, "checklist-chat", selectedItemId)
        );
        setNewMessage(draft ?? "");
      }
    }
  }, [selectedItemId, loadThread, user?.id]);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const currentItem = React.useMemo(() => {
    return checklist?.items.find((item) => item.id === selectedItemId) || null;
  }, [checklist, selectedItemId]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItemId || !newMessage.trim()) return;

    setSending(true);
    try {
      const posted = await postChecklistFeedback(selectedItemId, newMessage.trim());
      setMessages((prev) => [...prev, posted]);
      setNewMessage("");
      if (typeof window !== "undefined") {
        removeDraft(window.sessionStorage, fellowDraftKey(user?.id, "checklist-chat", selectedItemId));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to post message.");
    } finally {
      setSending(false);
    }
  }

  const reviewStatus = (currentItem?.review_status || "not_checked").toLowerCase();

  return (
    <PortalShell breadcrumbItems={["Notifications", "Checklist Feedback"]}>
      <div className="space-y-6 max-w-5xl">
        {/* Back navigation & Header */}
        <div>
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Fellow Checklist</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">
                Checklist Feedback
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-2xl">
                Use this page to explain your progress, pending work, or doubts about this checklist item. Your mentor can review and respond here.
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
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1.5 ${loadingThread ? "animate-spin" : ""
                    }`}
                />
                Refresh
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Item Selector if multiple items exist */}
        {checklist && checklist.items.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="font-bold text-[var(--color-text-muted)] shrink-0">
              Select Item:
            </span>
            {checklist.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedItemId(item.id);
                  router.replace(`/checklist-feedback?itemId=${item.id}`);
                }}
                className={`truncate max-w-[220px] rounded-full px-3 py-1 font-semibold transition-colors shrink-0 ${item.id === selectedItemId
                    ? "bg-[var(--color-brand-orange)] text-white shadow-xs"
                    : "border border-[var(--color-border-default)] bg-white text-[var(--color-text-body)] hover:border-orange-200"
                  }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        )}

        {/* Two-column layout: Left = Item Details & Decision, Right = Conversation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Item Overview & Review Status */}
          <div className="lg:col-span-5 space-y-4">
            {currentItem ? (
              <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-5 space-y-5 shadow-xs">
                {/* Scope context badge */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  <span>Batch Scope</span>
                  {currentItem.category && (
                    <>
                      <span>•</span>
                      <span className="text-[var(--color-brand-orange)]">
                        {currentItem.category}
                      </span>
                    </>
                  )}
                  {currentItem.is_required && (
                    <span className="rounded-full bg-[var(--color-brand-orange-subtle)] px-2 py-0.5 text-[var(--color-brand-orange)]">
                      Required
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)] leading-snug">
                    {currentItem.title}
                  </h2>
                  {currentItem.description && (
                    <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-body)]">
                      {currentItem.description}
                    </p>
                  )}
                </div>

                {/* Review Decision Status Box */}
                <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--color-text-muted)]">
                      Decision
                    </span>
                    {reviewStatus === "accepted" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Accepted
                      </span>
                    ) : reviewStatus === "rejected" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold text-[11px]">
                        <XCircle className="h-3.5 w-3.5" />
                        Rejected
                      </span>
                    ) : reviewStatus === "pending_review" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                        <Clock className="h-3.5 w-3.5" />
                        Pending Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                        Not Checked
                      </span>
                    )}
                  </div>

                  {/* Rejection Reason display if rejected */}
                  {reviewStatus === "rejected" && currentItem.rejection_reason && (
                    <div className="pt-2 border-t border-red-200 text-xs text-red-800 space-y-1">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-red-600">
                        Reason for Rejection:
                      </span>
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {currentItem.rejection_reason}
                      </p>
                    </div>
                  )}

                  {currentItem.due_at && (
                    <div className="pt-2 border-t border-[var(--color-border-default)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                      <span>Due Date:</span>
                      <span className="font-medium">
                        {new Date(currentItem.due_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Submitted response summary (Contribution & Reflection) */}
                {(currentItem.contribution || currentItem.reflection || currentItem.my_thoughts) && (
                  <div className="rounded-xl border border-[var(--color-border-default)] p-4 space-y-3 bg-white">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Your Saved Response
                    </div>
                    {currentItem.contribution && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">
                          Contribution:
                        </span>
                        <p className="text-xs text-[var(--color-text-body)] leading-relaxed whitespace-pre-wrap">
                          {currentItem.contribution}
                        </p>
                      </div>
                    )}
                    {currentItem.reflection && (
                      <div className="space-y-1 pt-2 border-t border-[var(--color-border-default)]">
                        <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">
                          Reflection:
                        </span>
                        <p className="text-xs text-[var(--color-text-body)] leading-relaxed whitespace-pre-wrap">
                          {currentItem.reflection}
                        </p>
                      </div>
                    )}
                    {currentItem.my_thoughts && (
                      <div className="space-y-1 pt-2 border-t border-[var(--color-border-default)]">
                        <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">
                          My Thoughts:
                        </span>
                        <p className="text-xs text-[var(--color-text-body)] leading-relaxed whitespace-pre-wrap">
                          {currentItem.my_thoughts}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--color-border-default)] p-8 text-center text-xs text-[var(--color-text-muted)] bg-white">
                {loading ? "Loading checklist..." : "No item selected."}
              </div>
            )}
          </div>

          {/* Right Column: Feedback Conversation History */}
          <div className="lg:col-span-7 flex flex-col h-[650px] rounded-2xl border border-[var(--color-border-default)] bg-white shadow-xs overflow-hidden">
            {/* Conversation Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-5 py-3.5 bg-gradient-to-r from-orange-50/40 to-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[var(--color-brand-orange)]" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Mentor Connect
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                {messages.length} message{messages.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[var(--color-bg-canvas)]/50">
              {loadingThread ? (
                <div className="flex min-h-[200px] items-center justify-center text-xs text-[var(--color-text-muted)]">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-[var(--color-brand-orange)]" />
                  Loading feedback messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-[var(--color-brand-orange)]">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    No comments yet
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                    Have doubts, questions, or need to explain partial progress? Send a message below and your mentor will respond here.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMentor =
                    msg.author_role?.toLowerCase() === "mentor" ||
                    msg.author_role?.toLowerCase() === "admin" ||
                    msg.author_role?.toLowerCase() === "program_manager";
                  const isSelf = user?.id === msg.author_user_id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSelf ? "items-end" : "items-start"
                        }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-[var(--color-text-muted)]">
                        {isMentor ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[var(--color-brand-blue)] bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Mentor
                          </span>
                        ) : (
                          <span className="font-semibold">Fellow</span>
                        )}
                        <span>•</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${isSelf
                            ? "bg-[var(--color-brand-orange)] text-white rounded-tr-xs"
                            : isMentor
                              ? "bg-white border border-blue-200 shadow-xs text-[var(--color-text-primary)] rounded-tl-xs"
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

            {/* Message Input Footer */}
            <form
              onSubmit={handleSendMessage}
              className="border-t border-[var(--color-border-default)] p-3 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewMessage(val);
                  if (selectedItemId && typeof window !== "undefined") {
                    saveExpiringDraft(
                      window.sessionStorage,
                      fellowDraftKey(user?.id, "checklist-chat", selectedItemId),
                      val
                    );
                  }
                }}
                placeholder="Ask a question, explain partial work, or request clarification..."
                disabled={sending || !selectedItemId}
                className="flex-1 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-orange)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-orange)] disabled:opacity-60"
              />
              <Button
                type="submit"
                size="sm"
                disabled={sending || !newMessage.trim() || !selectedItemId}
                className="bg-[var(--color-brand-orange)] hover:bg-[#e05423] text-white shrink-0 px-4"
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
