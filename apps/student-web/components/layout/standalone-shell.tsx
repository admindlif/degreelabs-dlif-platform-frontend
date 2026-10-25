"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, ArrowRight, LogOut, LockKeyhole, RefreshCw } from "lucide-react";
import { getFellowContext, tryGetFellowHomepage } from "@/lib/api/fellow";
import { FellowContext } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

interface StandaloneShellProps {
  children: React.ReactNode;
  context?: FellowContext | null;
  canEnterDiscover?: boolean;
}

export function StandaloneShell({
  children,
  context,
  canEnterDiscover: canEnterDiscoverProp,
}: StandaloneShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [loadedContext, setLoadedContext] =
    React.useState<FellowContext | null>(context ?? null);
  const [canEnterDiscover, setCanEnterDiscover] = React.useState<boolean>(
    canEnterDiscoverProp ?? true
  );
  const [logoutError, setLogoutError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (canEnterDiscoverProp !== undefined) {
      setCanEnterDiscover(canEnterDiscoverProp);
      return;
    }

    let active = true;

    tryGetFellowHomepage()
      .then((data) => {
        if (!active || !data) return;
        const rawPhases = Array.isArray(data)
          ? data
          : Array.isArray((data as any).phases)
            ? (data as any).phases
            : [(data as any)];
        const discover = rawPhases.find(
          (p: any) => p?.code?.toUpperCase() === "DISCOVER"
        );
        if (discover) {
          const unlocked = Boolean(
            discover.can_enter ||
              discover.access_status?.toLowerCase() === "unlocked" ||
              discover.access_status?.toLowerCase() === "active"
          );
          setCanEnterDiscover(unlocked);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [canEnterDiscoverProp]);

  React.useEffect(() => {
    if (context !== undefined) {
      return;
    }

    let active = true;

    getFellowContext()
      .then((data) => {
        if (active) setLoadedContext(data);
      })
      .catch((error) => {
        console.warn("Unable to load Fellow context for standalone shell:", error);
      });

    return () => {
      active = false;
    };
  }, [context]);

  const resolvedContext = context !== undefined ? context : loadedContext;

  const handleRefresh = React.useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  }, [isRefreshing, router]);

  const handleLogout = React.useCallback(async () => {
    setLogoutError(null);
    try {
      await logout();
    } catch {
      setLogoutError("Unable to sign out. Please try again.");
    }
  }, [logout]);

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : resolvedContext?.fellow
      ? `${resolvedContext.fellow.first_name?.[0] || ""}${resolvedContext.fellow.last_name?.[0] || ""}`.toUpperCase()
      : "FL";

  const displayName = user
    ? `${user.first_name} ${user.last_name}`
    : resolvedContext?.fellow
      ? `${resolvedContext.fellow.first_name} ${resolvedContext.fellow.last_name}`
      : "Fellow";

  const cohortName = resolvedContext?.cohort?.name ?? null;

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] flex flex-col text-[var(--color-text-primary)]">
      {/* Standalone Minimal Topbar */}
      <header className="sticky top-0 z-30 h-16 border-b border-[var(--color-border-default)] bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-4">
          {/* Left: DegreeLabs DLIF Brand */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/home"
              className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)] rounded-lg"
              title="DegreeLabs Impact Fellowship Home"
            >
              <div className="relative w-36 sm:w-40 h-9 flex items-center">
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

            <div className="hidden md:flex items-center gap-2 rounded-full border border-orange-100 bg-[var(--color-brand-orange-subtle)] px-3 py-1 text-[11px] font-bold text-[var(--color-brand-orange)] uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-orange)]" />
              Impact Fellowship
            </div>
          </div>

          {/* Right: Shortcut to Discover + Fellow Profile + Sign out */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {canEnterDiscover ? (
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-white px-3.5 py-1.5 text-xs font-bold text-[var(--color-text-secondary)] shadow-xs transition-all hover:border-orange-200 hover:bg-orange-50/50 hover:text-[var(--color-brand-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]"
                title="Open full Discover session roadmap & toolkit"
              >
                <Compass className="h-3.5 w-3.5 text-[var(--color-brand-orange)]" />
                <span className="hidden sm:inline">Discover Dashboard</span>
                <span className="sm:hidden">Discover</span>
                <ArrowRight className="h-3 w-3 text-[var(--color-text-muted)]" />
              </Link>
            ) : (
              <div
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] opacity-75 cursor-not-allowed"
                title="Discover Dashboard is currently locked"
              >
                <LockKeyhole className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                <span className="hidden sm:inline">Discover (Locked)</span>
                <span className="sm:hidden">Locked</span>
              </div>
            )}

            {cohortName && (
              <Badge variant="brand" size="sm" className="hidden lg:inline-flex">
                {cohortName}
              </Badge>
            )}

            {/* Topbar Refresh button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh page"
              title="Refresh"
              className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-white text-[var(--color-text-secondary)] shadow-xs transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:ring-offset-1 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                  isRefreshing ? "animate-spin text-[var(--color-brand-orange)]" : ""
                }`}
              />
            </button>

            <div className="h-5 w-px bg-[var(--color-border-default)] hidden sm:block" />

            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-navy)] text-[11px] font-bold text-white shadow-xs">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="truncate text-xs font-bold leading-tight text-[var(--color-text-primary)] max-w-36">
                  {displayName}
                </span>
                <span className="truncate text-[10px] text-[var(--color-text-muted)]">
                  Fellow Portal
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleLogout()}
              aria-label="Sign out"
              className="flex items-center gap-1.5 rounded-lg border border-transparent p-2 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-subtle)] hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Logout error message if any */}
      {logoutError && (
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-10 pt-4">
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
          >
            {logoutError}
          </p>
        </div>
      )}

      {/* Full-width Main Content */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {children}
      </main>

      {/* Minimal Standalone Footer */}
      <footer className="border-t border-[var(--color-border-default)] bg-white py-6 px-4 sm:px-6 lg:px-10 text-xs text-[var(--color-text-muted)]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--color-text-primary)]">DegreeLabs DLIF</span>
            <span>•</span>
            <span>DegreeLabs Impact Fellowship</span>
          </div>
          <div className="text-center sm:text-right">
            <span>Strategic problem-solving for measurable business impact.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
