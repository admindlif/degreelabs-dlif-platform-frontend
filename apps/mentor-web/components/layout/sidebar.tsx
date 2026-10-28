"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  ClipboardCheck,
  MessageSquare,
  FileText,
  Layout,
  Bell,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  className?: string;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

interface NavItemConfig {
  name: string;
  href: string;
  icon: React.ElementType;
  subtitle: string;
  exact?: boolean;
}

interface NavGroupConfig {
  title: string;
  items: NavItemConfig[];
}

export function Sidebar({ className, mobileOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [logoutError, setLogoutError] = React.useState<string | null>(null);

  const navigationGroups: NavGroupConfig[] = React.useMemo(
    () => [
      {
        title: "Workspace",
        items: [
          {
            name: "Home",
            href: "/home",
            icon: Home,
            subtitle: "Mentoring overview",
            exact: true,
          },
          {
            name: "My Teams",
            href: "/teams",
            icon: Users,
            subtitle: "Assigned teams & fellows",
          },
          {
            name: "Working Board",
            href: "/working-board",
            icon: Layout,
            subtitle: "Collaborative team documents",
          },
          {
            name: "Mentor Insights",
            href: "/working-board-insights",
            icon: FileText,
            subtitle: "Publish mentor observations",
          },
        ],
      },
      {
        title: "Checklists & Review",
        items: [
          {
            name: "Checklist Review",
            href: "/checklist-review",
            icon: ClipboardCheck,
            subtitle: "Accept or reject submissions",
          },
          {
            name: "Checklist Feedback",
            href: "/checklist-feedback",
            icon: MessageSquare,
            subtitle: "Direct fellow discussions",
          },
        ],
      },
      {
        title: "Account",
        items: [
          {
            name: "Notifications",
            href: "/notifications",
            icon: Bell,
            subtitle: "Alerts & updates",
          },
        ],
      },
    ],
    []
  );

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
    } catch {
      setLogoutError("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  function isItemActive(item: NavItemConfig) {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-dvh w-[min(260px,calc(100vw-3rem))] flex-col border-r border-[var(--color-border-default)] bg-white shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-[260px] lg:translate-x-0 lg:shadow-none",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--color-border-default)] px-5">
        <Link href="/home" onClick={onNavigate} className="flex items-center gap-3 group">
          <div className="relative w-36 h-9 flex items-center">
            <Image
              src="/degreelabs-logo.png"
              alt="DegreeLabs DLIF"
              width={160}
              height={36}
              className="object-contain"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Dedicated Portal Badge */}
      <div className="shrink-0 px-4 pb-2 pt-3">
        <div
          className="flex items-center justify-between rounded-xl border border-orange-100 px-3 py-2 shadow-xs"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--color-brand-orange) 9%, white), white 75%)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-brand-orange)] shadow-[0_0_0_3px_var(--color-brand-orange-subtle)]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Mentor Portal
            </span>
          </div>
          <Badge variant="brand" size="sm" className="text-[10px]">
            Mentor
          </Badge>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-5">
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <h4 className="flex items-center gap-2 px-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-orange)]" />
              {group.title}
            </h4>
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex min-h-14 min-w-0 items-center gap-2.5 overflow-hidden rounded-xl border px-2.5 py-2 text-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)] focus-visible:ring-offset-1 motion-reduce:transform-none motion-reduce:transition-none",
                      isActive
                        ? "border-orange-200 text-[var(--color-text-primary)] shadow-sm bg-gradient-to-br from-[var(--color-brand-orange-subtle)] to-white"
                        : "border-[var(--color-border-default)] bg-white text-[var(--color-text-body)] hover:-translate-y-0.5 hover:border-orange-200 hover:bg-gradient-to-br hover:from-[var(--color-brand-orange-subtle)] hover:to-white hover:text-[var(--color-text-primary)] hover:shadow-sm"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200 ease-out",
                        isActive
                          ? "border-orange-200 bg-white text-[var(--color-brand-orange)] shadow-xs"
                          : "border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] group-hover:border-orange-200 group-hover:bg-white group-hover:text-[var(--color-brand-orange)]"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-bold tracking-tight text-[var(--color-text-primary)]">
                        {item.name}
                      </span>
                      <span className="truncate text-[10px] text-[var(--color-text-muted)]">
                        {item.subtitle}
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-all duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-[var(--color-brand-orange)] motion-reduce:transform-none motion-reduce:transition-none",
                        isActive
                          ? "text-[var(--color-brand-orange)]"
                          : "text-[var(--color-text-muted)]"
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Mentor User Footer */}
      <div className="shrink-0 border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3">
        {logoutError && (
          <p
            role="alert"
            className="mb-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] font-semibold text-red-700"
          >
            {logoutError}
          </p>
        )}
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="w-2 h-2 shrink-0 rounded-full bg-[var(--color-success)]" />
            <span className="truncate text-xs font-semibold text-[var(--color-text-secondary)]">
              DegreeLabs Mentor
            </span>
          </div>
          <Badge variant="blue" size="sm" className="max-w-28 shrink-0 truncate">
            Mentor
          </Badge>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-border-default)] pt-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-navy)] text-[10px] font-bold text-white">
              {user
                ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
                : "MT"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-[11px] font-bold leading-tight text-[var(--color-text-primary)]">
                {user ? `${user.first_name} ${user.last_name}` : "Mentor"}
              </span>
              <span className="truncate text-[9px] text-[var(--color-text-muted)]">
                {user?.email || "Mentor Account"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            aria-label="Log out"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-brand-orange)] p-1.5 rounded-lg hover:bg-[var(--color-bg-subtle)] transition-colors shrink-0 disabled:opacity-50"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
