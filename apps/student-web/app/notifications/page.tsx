"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import {
  getFellowChecklist,
  updateChecklistCompletion,
} from "@/lib/api/checklist";
import type {
  ChecklistItem,
  ChecklistStatus,
  FellowChecklistResponse,
} from "@/lib/api/types";

type ChecklistFilter = "all" | "todo" | "overdue" | "completed";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : null;
}

function ChecklistAction({ item }: { item: ChecklistItem }) {
  if (!item.action_url) return null;

  const label = item.action_label || "Open";
  const className =
    "inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white px-4 py-2 text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-brand-orange)] hover:text-[var(--color-brand-orange)]";

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
  onToggle,
}: {
  item: ChecklistItem;
  saving: boolean;
  onToggle: (item: ChecklistItem) => void;
}) {
  const completed = item.status === "completed";
  const overdue = item.status === "overdue";
  const date = formatDate(completed ? item.completed_at : item.due_at);

  return (
    <article
      className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
        overdue
          ? "border-red-200 bg-red-50"
          : completed
            ? "border-emerald-200 bg-emerald-50"
            : "border-[var(--color-border-default)] bg-white"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => onToggle(item)}
          disabled={saving}
          aria-label={completed ? `Mark ${item.title} as pending` : `Mark ${item.title} as completed`}
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
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`break-words font-bold text-[var(--color-text-primary)] ${
                    completed ? "line-through opacity-65" : ""
                  }`}
                >
                  {item.title}
                </h3>
                {item.is_required && (
                  <span className="rounded-full bg-[var(--color-brand-orange-subtle)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-brand-orange)]">
                    Required
                  </span>
                )}
              </div>

              {item.description && (
                <p className="mt-1 break-words text-sm leading-6 text-[var(--color-text-body)]">
                  {item.description}
                </p>
              )}

              {(date || item.category) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-muted)]">
                  {date && (
                    <time suppressHydrationWarning className={overdue ? "font-semibold text-[var(--color-danger)]" : ""}>
                      {completed ? "Completed" : "Due"} {date}
                    </time>
                  )}
                  {date && item.category && <span aria-hidden="true">•</span>}
                  {item.category && <span>{item.category}</span>}
                </div>
              )}
            </div>
            <ChecklistAction item={item} />
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
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ChecklistFilter>("all");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const loadChecklist = useCallback(async () => {
    try {
      const data = await getFellowChecklist();
      setChecklist(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your checklist.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  async function toggleItem(item: ChecklistItem) {
    setSavingIds((current) => new Set(current).add(item.id));
    setError(null);
    try {
      await updateChecklistCompletion(item.id, !item.is_completed);
      await loadChecklist();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update this item.");
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  }

  const filters: Array<{ key: ChecklistFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: checklist?.summary.total ?? 0 },
    { key: "todo", label: "To Do", count: toDoCount },
    { key: "overdue", label: "Overdue", count: checklist?.summary.overdue ?? 0 },
    { key: "completed", label: "Completed", count: checklist?.summary.completed ?? 0 },
  ];

  return (
    <PortalShell breadcrumbItems={["Notifications"]}>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-extrabold">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Stay updated with fellowship actions and important updates.
          </p>
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
                            <ChecklistRow key={item.id} item={item} saving={savingIds.has(item.id)} onToggle={toggleItem} />
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
    </PortalShell>
  );
}
