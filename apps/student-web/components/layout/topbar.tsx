"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, ChevronRight, Menu, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SessionSummary } from "@/lib/api/types";

interface TopbarProps {
  breadcrumbs?: string[];
  roleTitle?: string;
  nextSession?: SessionSummary | null;
  onMenuClick?: () => void;
}

export function Topbar({
  breadcrumbs = ["Fellow Portal"],
  roleTitle = "Fellow Portal",
  nextSession,
  onMenuClick,
}: TopbarProps) {
  const nextSessionLabel = nextSession
    ? nextSession.status === "live"
      ? `Live Now: Session ${nextSession.session_number}`
      : `Next: Session ${nextSession.session_number}`
    : null;

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

      <div className="hidden xl:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            disabled
            aria-label="Portal search is not available yet"
            title="Portal search is not available yet"
            placeholder="Search is not available yet"
            className="w-full cursor-not-allowed bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)] rounded-full pl-9 pr-4 py-2 outline-none opacity-70 placeholder:text-[var(--color-text-muted)]"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {nextSessionLabel && (
          <div className="hidden lg:flex max-w-52 items-center gap-2 rounded-full bg-[var(--color-brand-orange-subtle)] border border-[#FFD5C6] px-3 py-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-orange)]" />
            <span className="truncate text-xs font-bold text-[var(--color-brand-orange)]">
              {nextSessionLabel}
            </span>
          </div>
        )}

        <Link
          href="/notifications"
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] shadow-xs transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </Link>

        <Badge variant="blue" size="md" className="hidden sm:inline-flex">
          {roleTitle}
        </Badge>
      </div>
    </header>
  );
}
