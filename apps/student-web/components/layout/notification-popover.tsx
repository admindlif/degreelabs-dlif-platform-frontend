"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Clock,
  Calendar,
} from "lucide-react";

import { getFellowChecklistReminders } from "@/lib/api/checklist";
import type { ChecklistReminderItem, ChecklistRemindersResponse } from "@/lib/api/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDeadline(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    return dateFormatter.format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

/**
 * Validate that target_url is a safe internal route (starts with "/").
 * Falls back to "/notifications" if the URL is external or missing.
 */
function safeInternalUrl(url: string): string {
  if (url.startsWith("/")) return url;
  return "/notifications";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationPopover() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [remindersData, setRemindersData] =
    React.useState<ChecklistRemindersResponse | null>(null);

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // ---- Data fetching -------------------------------------------------------

  const loadReminders = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await getFellowChecklistReminders();
      setRemindersData(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to load reminders."
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial fetch on mount + subscribe to checklist-updated events
  React.useEffect(() => {
    let cancelled = false;

    void getFellowChecklistReminders()
      .then((data) => {
        if (!cancelled) {
          setRemindersData(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load reminders."
          );
        }
      });

    const handleChecklistUpdated = () => {
      void loadReminders(false);
    };

    window.addEventListener("checklist-updated", handleChecklistUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("checklist-updated", handleChecklistUpdated);
    };
  }, [loadReminders]);

  // ---- Click-outside + Escape key -----------------------------------------

  React.useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // ---- Toggle handler ------------------------------------------------------

  const handleToggle = React.useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        void loadReminders(true);
      }
      return next;
    });
  }, [loadReminders]);

  // ---- Derived values ------------------------------------------------------

  // Badge uses total_count from backend — the definitive authoritative count.
  const totalCount = remindersData?.total_count ?? 0;

  // Display up to 5 reminders in the order returned by the backend.
  const displayedReminders: ChecklistReminderItem[] = React.useMemo(() => {
    if (!remindersData) return [];
    return remindersData.reminders.slice(0, 5);
  }, [remindersData]);

  const badgeText = totalCount > 9 ? "9+" : String(totalCount);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] shadow-xs transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:ring-offset-1"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {totalCount > 0 && (
          <span
            aria-label={`${totalCount} pending checklist reminders`}
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand-orange)] px-1 text-[10px] font-extrabold text-white shadow-xs pointer-events-none"
          >
            {badgeText}
          </span>
        )}
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] sm:hidden"
        />
      )}

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
          className="fixed inset-x-3 top-18 z-50 rounded-2xl border border-[var(--color-border-default)] bg-white shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-4 py-3 bg-[var(--color-bg-surface)]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-[var(--color-text-primary)]">
                Notifications
              </h2>
              {totalCount > 0 && (
                <span className="rounded-full bg-[var(--color-brand-orange-subtle)] border border-orange-200 px-2 py-0.5 text-[10px] font-bold text-[var(--color-brand-orange)]">
                  {totalCount} pending
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
              className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading && !remindersData ? (
              // Loading skeleton
              <div className="p-4 space-y-3" aria-label="Loading reminders">
                <div className="h-16 animate-pulse rounded-xl bg-[var(--color-bg-subtle)]" />
                <div className="h-16 animate-pulse rounded-xl bg-[var(--color-bg-subtle)]" />
              </div>
            ) : error ? (
              // Error state with retry
              <div className="p-6 text-center space-y-2">
                <AlertCircle className="w-7 h-7 mx-auto text-red-500" />
                <p className="text-xs font-semibold text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadReminders(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-default)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--color-text-primary)] hover:border-[var(--color-brand-orange)] hover:text-[var(--color-brand-orange)] transition-colors shadow-2xs"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            ) : displayedReminders.length === 0 ? (
              // Empty state
              <div className="p-8 text-center space-y-2.5">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  You&apos;re all caught up!
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
                  No pending checklist tasks or deadlines right now.
                </p>
              </div>
            ) : (
              // Reminder list — backend order preserved
              <ul className="divide-y divide-[var(--color-border-default)]">
                {displayedReminders.map((item) => {
                  const isOverdue = item.status === "overdue";
                  const deadline = formatDeadline(item.due_at);
                  const href = safeInternalUrl(item.target_url);

                  return (
                    <li
                      key={item.id}
                      className="p-3.5 hover:bg-[var(--color-bg-surface)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-[var(--color-text-primary)] break-words leading-tight">
                            {item.title}
                          </span>
                        </span>

                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                            isOverdue
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isOverdue ? "Overdue" : "Due Soon"}
                        </span>
                      </div>

                      {item.message && (
                        <p className="mt-1 text-[11px] text-[var(--color-text-body)] line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px]">
                        <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] truncate">
                          {isOverdue ? (
                            <Clock className="w-3 h-3 shrink-0 text-red-500" />
                          ) : (
                            <Calendar className="w-3 h-3 shrink-0 text-[var(--color-text-muted)]" />
                          )}
                          <span
                            className={
                              isOverdue
                                ? "font-semibold text-red-600 truncate"
                                : "truncate"
                            }
                          >
                            {deadline
                              ? `${isOverdue ? "Was due" : "Due"} ${deadline}`
                              : "No deadline"}
                          </span>
                        </div>

                        <Link
                          href={href}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-[var(--color-brand-orange)] hover:underline"
                        >
                          View
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--color-border-default)] p-3 bg-[var(--color-bg-surface)] text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white border border-[var(--color-border-default)] px-4 py-2 text-xs font-bold text-[var(--color-text-primary)] hover:border-[var(--color-brand-orange)] hover:text-[var(--color-brand-orange)] transition-colors shadow-2xs"
            >
              View Full Checklist
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
