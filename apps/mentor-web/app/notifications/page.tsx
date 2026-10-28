"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  ClipboardCheck,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getMentorNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/mentor";
import type { MentorNotification } from "@/lib/api/types";

function NotificationIcon({ type }: { type: string }) {
  if (type === "checklist_discussion") {
    return (
      <div className="h-9 w-9 rounded-full bg-blue-50 text-[var(--color-blue)] flex items-center justify-center shrink-0">
        <MessageSquare className="h-4 w-4" />
      </div>
    );
  }
  if (type === "checklist_submitted") {
    return (
      <div className="h-9 w-9 rounded-full bg-orange-50 text-[var(--color-brand-orange)] flex items-center justify-center shrink-0">
        <ClipboardCheck className="h-4 w-4" />
      </div>
    );
  }
  if (type === "submission_updated" || type === "working_board_updated" || type === "working_board_insights") {
    return (
      <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <FileText className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="h-9 w-9 rounded-full bg-gray-100 text-[var(--color-text-secondary)] flex items-center justify-center shrink-0">
      <Bell className="h-4 w-4" />
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<MentorNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [markingAll, setMarkingAll] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [error, setError] = React.useState<string | null>(null);

  const loadNotifications = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMentorNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkOne = async (notification: MentorNotification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }

    if (notification.target_url) {
      const target = notification.target_url.replace(
        "/submission-insights",
        "/working-board-insights"
      );
      router.push(target);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const filteredNotifications = React.useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.is_read);
    }
    return notifications;
  }, [notifications, filter]);

  return (
    <PortalShell breadcrumbItems={["Notifications"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--color-navy)] tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <Badge variant="brand" size="sm">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Stay updated on submissions, checklist reviews, and fellow discussions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markingAll || loading}
                className="gap-2 text-xs"
              >
                <CheckCheck className={`h-4 w-4 ${markingAll ? "animate-spin" : ""}`} />
                Mark all as read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={loadNotifications}
              disabled={loading}
              className="gap-1.5 text-xs text-[var(--color-text-secondary)]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-[var(--color-navy)] text-white"
                : "bg-white text-[var(--color-text-secondary)] hover:bg-gray-50 border border-[var(--color-border)]"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === "unread"
                ? "bg-[var(--color-navy)] text-white"
                : "bg-white text-[var(--color-text-secondary)] hover:bg-gray-50 border border-[var(--color-border)]"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Content */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-[var(--color-border)]">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-orange)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--color-navy)]">
              Loading notifications...
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-[var(--color-border)]">
            <Bell className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
            <h3 className="font-semibold text-[var(--color-navy)]">
              {filter === "unread" ? "No Unread Notifications" : "No Notifications"}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {filter === "unread"
                ? "You have caught up with all your notifications!"
                : "You don't have any notifications at the moment."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkOne(notif)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                  !notif.is_read
                    ? "bg-blue-50/40 border-[var(--color-blue)]/30 hover:border-[var(--color-blue)]/60 shadow-xs"
                    : "bg-white border-[var(--color-border)] hover:border-gray-300"
                }`}
              >
                <NotificationIcon type={notif.type} />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-sm tracking-tight ${
                        !notif.is_read
                          ? "font-bold text-[var(--color-navy)]"
                          : "font-medium text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {notif.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(notif.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {!notif.is_read && (
                        <span className="h-2 w-2 rounded-full bg-[var(--color-brand-orange)]" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.target_url && (
                    <div className="pt-1 flex items-center gap-1 text-[11px] font-medium text-[var(--color-blue)]">
                      <span>View details</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
