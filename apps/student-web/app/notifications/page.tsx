"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import {
  getFellowChecklist,
  updateChecklistCompletion,
} from "@/lib/api/checklist";
import type {
  ChecklistItem,
  ChecklistReviewStatus,
  ChecklistStatus,
  FellowChecklistResponse,
} from "@/lib/api/types";
import { ChecklistResponseModal } from "@/components/checklist/checklist-response-modal";

type ChecklistFilter = "all" | "todo" | "overdue" | "completed";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : null;
}

function ReviewStatusBadge({
  reviewStatus,
  isCompleted,
}: {
  reviewStatus?: ChecklistReviewStatus | string;
  isCompleted: boolean;
}) {
  const normalized = (reviewStatus || (isCompleted ? "pending_review" : "not_checked")).toLowerCase();

  if (normalized === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Accepted
      </span>
    );
  }

  if (normalized === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
        <AlertCircle className="h-3 w-3" />
        Rejected
      </span>
    );
  }

  if (normalized === "pending_review" || isCompleted) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
        <LoaderCircle className="h-3 w-3" />
        Pending Review
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
      Not Checked
    </span>
  );
}

function ChecklistAction({ item }: { item: ChecklistItem }) {
  if (!item.action_url) return null;

  const label = item.action_label || "Open";
  const className =
    "inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white px-3.5 py-1.5 text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-brand-orange)] hover:text-[var(--color-brand-orange)]";

  if (item.action_url.startsWith("/")) {
    return (
      <Link href={item.action_url} className={className}>
        {label} <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    );
  }

  return (
    <a
      href={item.action_url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {label} <ArrowUpRight className="h-3.5 w-3.5" />
    </a>
  );
}

function ChecklistRow({
  item,
  saving,
  onCheckClick,
  onOpenResponseModal,
}: {
  item: ChecklistItem;
  saving: boolean;
  onCheckClick: (item: ChecklistItem) => void;
  onOpenResponseModal: (item: ChecklistItem) => void;
}) {
  const completed = item.review_status === "accepted" || item.status === "completed";
  const submitted =
    item.is_submitted ||
    item.review_status === "pending_review" ||
    item.review_status === "rejected" ||
    Boolean(item.contribution || item.reflection || item.my_thoughts);
  const overdue = item.status === "overdue";
  const date = formatDate(completed ? item.completed_at : item.due_at);
  const isRejected = item.review_status === "rejected";

  return (
    <article
      className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
        isRejected
          ? "border-red-200 bg-red-50/40"
          : overdue
          ? "border-red-200 bg-red-50"
          : completed
          ? "border-emerald-200/80 bg-emerald-50/40"
          : "border-[var(--color-border-default)] bg-white"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => onCheckClick(item)}
          disabled={saving}
          aria-label={completed ? `View or edit response for ${item.title}` : `Check ${item.title}`}
          aria-pressed={completed}
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${
            completed
              ? "border-[var(--color-success)] bg-[var(--color-success)] text-white"
              : "border-[var(--color-border-strong)] bg-white text-transparent hover:border-[var(--color-brand-orange)]"
          }`}
        >
          {saving ? (
            <LoaderCircle className="h-4 w-4 animate-spin text-[var(--color-brand-orange)]" />
          ) : (
            <Check className="h-4 w-4" strokeWidth={3} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              {/* Session name & Badges */}
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                {item.session_name && (
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-100">
                    {item.session_name}
                  </span>
                )}
                <ReviewStatusBadge
                  reviewStatus={item.review_status}
                  isCompleted={completed}
                />
                {item.is_required && (
                  <span className="rounded-full bg-[var(--color-brand-orange-subtle)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-brand-orange)]">
                    Required
                  </span>
                )}
              </div>

              {/* Title */}
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`break-words font-bold text-[var(--color-text-primary)] ${
                    completed && item.review_status === "accepted" ? "line-through opacity-70" : ""
                  }`}
                >
                  {item.title}
                </h3>
              </div>

              {/* Description */}
              {item.description && (
                <p className="mt-1 break-words text-sm leading-6 text-[var(--color-text-body)]">
                  {item.description}
                </p>
              )}

              {/* Rejection Reason Notice */}
              {isRejected && item.rejection_reason && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-100/60 p-3 text-xs text-red-900">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-red-700 block mb-0.5">
                    Mentor Rejection Reason:
                  </span>
                  <p className="leading-relaxed whitespace-pre-wrap">{item.rejection_reason}</p>
                </div>
              )}

              {/* Context info (Due date, Category) */}
              {(date || item.category) && (
                <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-muted)]">
                  {date && (
                    <time suppressHydrationWarning className={overdue ? "font-semibold text-[var(--color-danger)]" : ""}>
                      {completed ? "Completed" : "Due"} {date}
                    </time>
                  )}
                  {date && item.category && <span aria-hidden="true">•</span>}
                  {item.category && <span>{item.category}</span>}
                </div>
              )}

              {/* Fellow contribution / reflection summary snippet if filled */}
              {(item.contribution || item.reflection || item.my_thoughts) && (
                <div className="mt-3 rounded-xl border border-[var(--color-border-default)] bg-white/70 p-3 text-xs text-[var(--color-text-secondary)] space-y-1.5">
                  {item.contribution && (
                    <div>
                      <span className="font-semibold text-[var(--color-text-primary)]">My Contribution: </span>
                      <span className="line-clamp-2">{item.contribution}</span>
                    </div>
                  )}
                  {item.reflection && (
                    <div>
                      <span className="font-semibold text-[var(--color-text-primary)]">Reflection: </span>
                      <span className="line-clamp-2">{item.reflection}</span>
                    </div>
                  )}
                  {item.my_thoughts && (
                    <div>
                      <span className="font-semibold text-[var(--color-text-primary)]">My Thoughts: </span>
                      <span className="line-clamp-2">{item.my_thoughts}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons: View/Edit Response, View Feedback, and Action URL */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenResponseModal(item)}
                  className="h-8 gap-1.5 rounded-full text-xs font-semibold border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:border-[var(--color-brand-orange)] hover:text-[var(--color-brand-orange)]"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {submitted ? "View / Edit Response" : "Complete Response"}
                </Button>

                <Link
                  href={`/checklist-feedback?itemId=${item.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white px-3 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-brand-orange)] hover:text-[var(--color-brand-orange)]"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  View Feedback
                </Link>

                <ChecklistAction item={item} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function sectionLabel(status: ChecklistStatus) {
  if (status === "overdue") return "Overdue";
  if (status === "completed") return "Completed";
  return "To Do";
}

export default function NotificationsPage() {
  const [checklist, setChecklist] = useState<FellowChecklistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ChecklistFilter>("all");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const loadChecklist = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getFellowChecklist();
      setChecklist(data);
      setError(null);
      if (silent) {
        setLastRefreshedAt(new Date());
        window.dispatchEvent(new CustomEvent("checklist-updated"));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your checklist.");
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    void loadChecklist(true);
  }, [loadChecklist, refreshing]);

  useEffect(() => {
    let cancelled = false;

    void getFellowChecklist()
      .then((data) => {
        if (cancelled) return;
        setChecklist(data);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load your checklist.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toDoCount = checklist
    ? Math.max(checklist.summary.pending - checklist.summary.overdue, 0)
    : 0;

  const filteredItems = useMemo(() => {
    if (!checklist) return [];
    if (filter === "all") return checklist.items;
    if (filter === "todo") return checklist.items.filter((item) => item.status === "pending");
    return checklist.items.filter((item) => item.status === filter);
  }, [checklist, filter]);

  const groups = useMemo(
    () =>
      (["overdue", "pending", "completed"] as ChecklistStatus[])
        .map((status) => ({
          status,
          items: filteredItems.filter((item) => item.status === status),
        }))
        .filter((group) => group.items.length > 0),
    [filteredItems]
  );

  const [modalItem, setModalItem] = useState<ChecklistItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleOpenResponseModal(item: ChecklistItem) {
    setModalItem(item);
    setIsModalOpen(true);
  }

  function handleCheckClick(item: ChecklistItem) {
    // If not completed or if clicking the checklist toggle, open modal per spec:
    // "When the fellow checks an item, open a modal... After saving: store response, show Pending Review"
    handleOpenResponseModal(item);
  }

  function handleResponseSaved(_updated: ChecklistItem) {
    void loadChecklist(true);
  }

  const filters: Array<{ key: ChecklistFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: checklist?.summary.total ?? 0 },
    { key: "todo", label: "To Do", count: toDoCount },
    { key: "overdue", label: "Overdue", count: checklist?.summary.overdue ?? 0 },
    { key: "completed", label: "Completed", count: checklist?.summary.completed ?? 0 },
  ];

  return (
    <PortalShell breadcrumbItems={["Checklist"]}>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Checklist</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Stay updated with fellowship actions, checklist responses, and mentor feedback.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {lastRefreshedAt && (
              <span className="hidden sm:inline text-xs text-[var(--color-text-muted)] font-medium">
                Updated {lastRefreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="self-start sm:self-auto h-9 gap-2 text-xs"
              title="Refresh checklist"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[var(--color-brand-orange)]" : ""}`} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="space-y-4" aria-label="Loading checklist">
            <div className="h-48 animate-pulse rounded-2xl bg-[var(--color-bg-subtle)]" />
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-24 animate-pulse rounded-2xl bg-[var(--color-bg-subtle)]" />
            ))}
          </div>
        ) : (
          <>
            {error && (
              <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
                <button type="button" onClick={() => void loadChecklist()} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)]">
                  <RefreshCw className="h-4 w-4" /> Try again
                </button>
              </div>
            )}

            {checklist && (
              <>
                <section className="rounded-2xl border border-[var(--color-border-default)] bg-white p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-brand-orange-subtle)] text-[var(--color-brand-orange)]">
                        <ClipboardCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand-orange)]">Checklist</p>
                        <h2 className="text-lg font-extrabold text-[var(--color-brand-navy)]">
                          {checklist.summary.completed} of {checklist.summary.total} completed
                        </h2>
                      </div>
                    </div>
                    <span className="text-2xl font-extrabold text-[var(--color-brand-navy)]">
                      {checklist.summary.percentage}%
                    </span>
                  </div>

                  <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[var(--color-bg-subtle)]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={checklist.summary.percentage}>
                    <div className="h-full rounded-full bg-[var(--color-brand-orange)] transition-[width] duration-300" style={{ width: `${checklist.summary.percentage}%` }} />
                  </div>

                  <div className="mt-5 grid grid-cols-3 divide-x divide-[var(--color-border-default)] rounded-2xl bg-[var(--color-bg-surface)] py-3 text-center">
                    <div><strong className="block text-lg text-[var(--color-danger)]">{checklist.summary.overdue}</strong><span className="text-xs text-[var(--color-text-muted)]">Overdue</span></div>
                    <div><strong className="block text-lg text-[var(--color-text-primary)]">{toDoCount}</strong><span className="text-xs text-[var(--color-text-muted)]">To Do</span></div>
                    <div><strong className="block text-lg text-[var(--color-success)]">{checklist.summary.completed}</strong><span className="text-xs text-[var(--color-text-muted)]">Completed</span></div>
                  </div>
                </section>

                <nav aria-label="Checklist filters" className="flex max-w-full gap-2 overflow-x-auto pb-1">
                  {filters.map((item) => (
                    <button key={item.key} type="button" onClick={() => setFilter(item.key)} aria-pressed={filter === item.key} className={`min-h-10 shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${filter === item.key ? "border-[var(--color-brand-orange)] bg-[var(--color-brand-orange)] text-white" : "border-[var(--color-border-default)] bg-white text-[var(--color-text-body)] hover:border-[var(--color-brand-orange)]"}`}>
                      {item.label} <span className="ml-1 opacity-75">{item.count}</span>
                    </button>
                  ))}
                </nav>

                {groups.length > 0 ? (
                  <div className="space-y-7">
                    {groups.map((group) => (
                      <section key={group.status} aria-labelledby={`checklist-${group.status}`}>
                        <div className="mb-3 flex items-center gap-2">
                          {group.status === "completed" && <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />}
                          <h2 id={`checklist-${group.status}`} className={`text-xs font-extrabold uppercase tracking-[0.14em] ${group.status === "overdue" ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"}`}>
                            {sectionLabel(group.status)}
                          </h2>
                          <span className="text-xs text-[var(--color-text-muted)]">{group.items.length}</span>
                        </div>
                        <div className="space-y-3">
                          {group.items.map((item) => (
                            <ChecklistRow
                              key={item.id}
                              item={item}
                              saving={savingIds.has(item.id)}
                              onCheckClick={handleCheckClick}
                              onOpenResponseModal={handleOpenResponseModal}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-8 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--color-success)]" />
                    <h2 className="mt-3 font-bold">No items in this view</h2>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {checklist.summary.total === 0 ? "Your checklist is clear for now." : "Choose another filter to see more items."}
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <ChecklistResponseModal
        item={modalItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleResponseSaved}
        onOpenFeedback={(item) => {
          window.location.href = `/checklist-feedback?itemId=${item.id}`;
        }}
      />
    </PortalShell>
  );
}
