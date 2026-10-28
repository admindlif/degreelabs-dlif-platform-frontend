"use client";

import * as React from "react";
import { ChevronRight, Menu, RefreshCw, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  breadcrumbs?: string[];
  roleTitle?: string;
  unreadNotifications?: number;
  onMenuClick?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Topbar({
  breadcrumbs = ["Mentor Portal"],
  roleTitle = "Mentor Portal",
  unreadNotifications = 0,
  onMenuClick,
  onRefresh,
  isRefreshing: isRefreshingProp,
}: TopbarProps) {
  const router = useRouter();
  const [internalRefreshing, setInternalRefreshing] = React.useState(false);

  const isRefreshing = isRefreshingProp ?? internalRefreshing;

  const handleRefresh = React.useCallback(() => {
    if (isRefreshing) return;
    if (onRefresh) {
      onRefresh();
    } else {
      setInternalRefreshing(true);
      router.refresh();
      setTimeout(() => setInternalRefreshing(false), 600);
    }
  }, [isRefreshing, onRefresh, router]);

  return (
    <header className="h-16 sticky top-0 z-20 bg-[var(--color-bg-canvas)]/90 backdrop-blur-md border-b border-[var(--color-border-default)] px-4 sm:px-6 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-xs font-medium text-[var(--color-text-muted)] sm:gap-2">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={`${crumb}-${idx}`}>
            {idx > 0 && (
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 opacity-50 ${
                  idx === breadcrumbs.length - 1 ? "block" : "hidden sm:block"
                }`}
              />
            )}
            <span
              className={`truncate ${
                idx === breadcrumbs.length - 1
                  ? "font-bold text-[var(--color-text-primary)]"
                  : "hidden text-[var(--color-text-secondary)] sm:inline"
              }`}
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Refresh button */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh page"
          title="Refresh"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] shadow-xs transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:ring-offset-1 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              isRefreshing ? "animate-spin text-[var(--color-brand-orange)]" : ""
            }`}
          />
        </button>

        {/* Notifications */}
        <Link
          href="/notifications"
          aria-label="Notifications"
          title="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] shadow-xs transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:ring-offset-1"
        >
          <Bell className="h-4 w-4" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-brand-orange)] text-[9px] font-bold text-white shadow-xs">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </Link>

        <Badge variant="blue" size="md" className="hidden sm:inline-flex">
          {roleTitle}
        </Badge>
      </div>
    </header>
  );
}
