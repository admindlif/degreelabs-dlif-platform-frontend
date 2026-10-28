"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  ClipboardCheck,
  Bell,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Layout,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Badge } from "@/components/ui/badge";
import { getMentorHome } from "@/lib/api/mentor";
import type { MentorHomeResponse } from "@/lib/api/types";

export default function HomePage() {
  const [data, setData] = React.useState<MentorHomeResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getMentorHome()
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Unable to load dashboard.")
      )
      .finally(() => setLoading(false));
  }, []);

  const totalPending = data?.pending_reviews.reduce(
    (sum, t) => sum + t.pending_count,
    0
  ) ?? 0;

  const quickLinks = [
    {
      href: "/checklist-review",
      icon: ClipboardCheck,
      label: "Checklist Review",
      description: "Review fellow submissions and provide accept/reject decisions",
      count: totalPending,
      countLabel: "pending",
      color: "text-[var(--color-brand-orange)]",
      bg: "bg-[var(--color-brand-orange-subtle)]",
    },
    {
      href: "/teams",
      icon: Users,
      label: "My Teams",
      description: "View your assigned teams, fellow profiles, and team progress",
      count: data?.assigned_teams.length ?? 0,
      countLabel: "teams",
      color: "text-[var(--color-brand-blue)]",
      bg: "bg-[var(--color-brand-blue-subtle)]",
    },
    {
      href: "/working-board",
      icon: Layout,
      label: "Working Board",
      description: "Access team Google documents and collaborate on sessions",
      count: null,
      countLabel: null,
      color: "text-[var(--color-brand-blue)]",
      bg: "bg-[var(--color-brand-blue-subtle)]",
    },
    {
      href: "/working-board-insights",
      icon: FileText,
      label: "Mentor Insights",
      description: "Review team working boards and publish mentor observations",
      count: null,
      countLabel: null,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      href: "/notifications",
      icon: Bell,
      label: "Notifications",
      description: "Stay updated on fellow activity and checklist changes",
      count: data?.unread_notifications ?? 0,
      countLabel: "unread",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <PortalShell
      breadcrumbItems={["Home"]}
      unreadNotifications={data?.unread_notifications ?? 0}
    >
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">
            Welcome back
            {data?.mentor.first_name ? `, ${data.mentor.first_name}` : ""}
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Here&apos;s your mentoring overview for today.
          </p>
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

        {loading ? (
          <div className="flex items-center gap-2 py-12 text-xs text-[var(--color-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading dashboard...
          </div>
        ) : (
          <>
            {/* Pending Reviews Alert */}
            {totalPending > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-800">
                      {totalPending} checklist item{totalPending !== 1 ? "s" : ""} awaiting your review
                    </div>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Fellows are waiting for accept/reject decisions on their submissions.
                    </p>
                  </div>
                </div>
                <Link
                  href="/checklist-review"
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
                >
                  Review now
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-xs hover:shadow-sm hover:border-[var(--color-border-strong)] transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}>
                        <Icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      {item.count !== null && item.count > 0 && (
                        <Badge variant={item.href === "/checklist-review" ? "warning" : "muted"} size="sm">
                          {item.count} {item.countLabel}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-orange)] transition-colors">
                      {item.label}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </Link>
                );
              })}
            </div>

            {/* Per-Team Pending Review Cards */}
            {data && data.pending_reviews.filter((t) => t.pending_count > 0).length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">
                  Teams With Pending Reviews
                </h2>
                <div className="space-y-2">
                  {data.pending_reviews
                    .filter((t) => t.pending_count > 0)
                    .map((t) => (
                      <Link
                        key={t.team_id}
                        href={`/checklist-review?teamId=${t.team_id}`}
                        className="flex items-center justify-between rounded-xl border border-[var(--color-border-default)] bg-white px-4 py-3 hover:border-[var(--color-brand-orange)] hover:shadow-xs transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-[var(--color-brand-orange-subtle)] flex items-center justify-center text-xs font-bold text-[var(--color-brand-orange)]">
                            {t.team_name[0]}
                          </div>
                          <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                            {t.team_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="warning" size="sm">
                            {t.pending_count} pending
                          </Badge>
                          <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-orange)]" />
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* Assigned Teams Overview */}
            {data && data.assigned_teams.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">
                  My Assigned Teams
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.assigned_teams.map((team: any) => {
                    const tId = team.id || team.team_id;
                    const tName = team.name || team.team_name;
                    return (
                      <Link
                        key={tId}
                        href={`/teams/${tId}`}
                        className="rounded-xl border border-[var(--color-border-default)] bg-white p-4 hover:border-[var(--color-brand-orange)] hover:shadow-xs transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-orange)] transition-colors">
                              {tName}
                            </div>
                            {team.company_name && (
                              <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                                {team.company_name}
                              </div>
                            )}
                          </div>
                          <Badge variant="muted" size="sm">
                            {team.member_count} fellows
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
                          <CheckCircle2 className="h-3 w-3" />
                          {team.current_phase?.name ?? "No active phase"}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PortalShell>
  );
}
