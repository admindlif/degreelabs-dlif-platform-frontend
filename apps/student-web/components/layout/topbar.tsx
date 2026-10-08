"use client";

import * as React from "react";
import { ChevronRight, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SessionSummary } from "@/lib/api/types";
import { NotificationPopover } from "./notification-popover";

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



      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {nextSessionLabel && (
          <div className="hidden lg:flex max-w-52 items-center gap-2 rounded-full bg-[var(--color-brand-orange-subtle)] border border-[#FFD5C6] px-3 py-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-orange)]" />
            <span className="truncate text-xs font-bold text-[var(--color-brand-orange)]">
              {nextSessionLabel}
            </span>
          </div>
        )}

        <NotificationPopover />

        <Badge variant="blue" size="md" className="hidden sm:inline-flex">
          {roleTitle}
        </Badge>
      </div>
    </header>
  );
}
