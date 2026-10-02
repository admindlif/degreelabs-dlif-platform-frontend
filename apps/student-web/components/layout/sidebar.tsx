"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Compass,
  Users,
  Bell,
  ShieldCheck,
  LogOut,
  LockKeyhole,
  Circle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { getDiscoverWeeks } from "@/lib/api/discover";
import { getFellowTeam } from "@/lib/api/toolkit";

import {
  DiscoverWeek,
  FellowContext,
  SessionSummary,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  className?: string;
  context?: FellowContext | null;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

type SectionVisualState = "current" | "completed" | "upcoming" | "locked";

const INDUCTION_SECTION_KEY = "induction";

function weekSectionKey(week: DiscoverWeek) {
  return `week-${week.id}`;
}

function weekVisualState(week: DiscoverWeek): SectionVisualState {
  if (week.status === "active") return "current";
  if (week.status === "completed") return "completed";
  if (week.status === "locked") return "locked";
  return "upcoming";
}

function weekStatusLabel(week: DiscoverWeek) {
  if (week.status === "active") return "Current";
  if (week.status === "completed") return "Completed";
  if (week.status === "locked") return "Locked";
  return week.status_badge || "Upcoming";
}

function sessionStatusLabel(session: SessionSummary) {
  return session.status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SessionSidebarItem({
  session,
  selected,
  expanded,
  onNavigate,
}: {
  session: SessionSummary;
  selected: boolean;
  expanded: boolean;
  onNavigate?: () => void;
}) {
  const locked = !session.is_unlocked;

  if (locked) {
    return (
      <div
        aria-disabled="true"
        className="flex cursor-not-allowed items-start gap-2.5 rounded-xl border border-transparent bg-[var(--color-bg-subtle)] px-3 py-2.5 text-xs text-[var(--color-text-muted)] opacity-80"
      >
        <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div className="min-w-0">
          <div className="font-semibold">Session {session.session_number}</div>
          {session.title !== `Session ${session.session_number}` && (
            <div className="mt-0.5 truncate text-[10px] font-normal">
              {session.title}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/sessions/${session.id}`}
      onClick={onNavigate}
      tabIndex={expanded ? 0 : -1}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "group relative flex min-w-0 items-start gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-200 motion-reduce:transition-none",
        selected
          ? "border-orange-200 bg-[var(--color-brand-orange-subtle)] text-[var(--color-text-primary)] shadow-sm"
          : "border-transparent text-[var(--color-text-body)] hover:border-orange-100 hover:bg-gradient-to-r hover:from-white hover:to-[var(--color-brand-orange-subtle)] hover:text-[var(--color-text-primary)]"
      )}
      style={
        selected
          ? {
              background:
                "linear-gradient(90deg, color-mix(in srgb, var(--color-brand-orange) 13%, white), white 82%)",
            }
          : undefined
      }
    >
      {selected && (
        <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[var(--color-brand-orange)]" />
      )}
      <Circle className="mt-1 h-2.5 w-2.5 shrink-0 fill-current text-[var(--color-brand-orange)]" />

      <div className="min-w-0">
        <div className={cn(selected && "text-[var(--color-brand-orange)]")}>
          Session {session.session_number}
        </div>

        <div className="mt-0.5 truncate text-[10px] font-normal text-[var(--color-text-muted)]">
          {session.title}
        </div>
      </div>
    </Link>
  );
}

function AccordionHeader({
  panelId,
  number,
  label,
  title,
  statusLabel,
  state,
  completion,
  expanded,
  onToggle,
}: {
  panelId: string;
  number: string;
  label: string;
  title?: string;
  statusLabel: string;
  state: SectionVisualState;
  completion?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const current = state === "current";
  const completed = state === "completed";
  const locked = state === "locked";

  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={panelId}
      onClick={onToggle}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border px-2.5 py-2.5 text-left transition-all duration-200 ease-out motion-reduce:transition-none",
        current && "border-orange-200 shadow-sm",
        completed && "border-[var(--color-border-default)] bg-white hover:border-emerald-200",
        locked && "border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]",
        state === "upcoming" && "border-[var(--color-border-default)] bg-white hover:border-orange-200 hover:bg-gradient-to-r hover:from-white hover:to-[var(--color-brand-orange-subtle)]"
      )}
      style={
        current
          ? {
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--color-brand-orange) 12%, white), white 72%)",
            }
          : undefined
      }
    >
      {current && (
        <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[var(--color-brand-orange)]" />
      )}

      <span className="flex min-w-0 items-start gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-extrabold tracking-wider",
            current && "border-orange-200 bg-white text-[var(--color-brand-orange)]",
            completed && "border-emerald-200 bg-emerald-50 text-emerald-700",
            locked && "border-[var(--color-border-default)] bg-white text-[var(--color-text-muted)]",
            state === "upcoming" && "border-orange-100 bg-[var(--color-brand-orange-subtle)] text-[var(--color-brand-orange)]"
          )}
        >
          {number}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            {current && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand-orange)]" />}
            {completed && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />}
            {locked && <LockKeyhole className="h-3 w-3 shrink-0" />}
            <span className="truncate text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-text-primary)]">
              {label}
            </span>
          </span>

          {title && (
            <span className="mt-0.5 block truncate text-[10px] font-medium text-[var(--color-text-muted)]">
              {title}
            </span>
          )}

          <span className="mt-1 flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                "truncate rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider",
                current && "bg-[var(--color-brand-orange)] text-white",
                completed && "bg-emerald-50 text-emerald-700",
                locked && "bg-white text-[var(--color-text-muted)]",
                state === "upcoming" && "bg-[var(--color-brand-orange-subtle)] text-[var(--color-brand-orange)]"
              )}
            >
              {statusLabel}
            </span>
            {completion && (
              <span className="truncate text-[8px] font-semibold text-[var(--color-text-muted)]">
                {completion}
              </span>
            )}
          </span>
        </span>

        <ChevronDown
          aria-hidden="true"
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 ease-out motion-reduce:transition-none",
            expanded && "rotate-180",
            current && "text-[var(--color-brand-orange)]"
          )}
        />
      </span>
    </button>
  );
}

function AccordionPanel({
  id,
  expanded,
  children,
}: {
  id: string;
  expanded: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      aria-hidden={!expanded}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
        expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}
    >
      <div className="overflow-hidden">
        <div className="space-y-1 pb-1 pl-1 pt-1.5">{children}</div>
      </div>
    </div>
  );
}

export function Sidebar({
  className,
  context,
  mobileOpen = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [weeks, setWeeks] = React.useState<DiscoverWeek[]>([]);
  const [teamName, setTeamName] = React.useState<string | null>(null);
  const [manuallyExpanded, setManuallyExpanded] = React.useState<Set<string>>(
    () => new Set()
  );
  const [collapsedAutoOverride, setCollapsedAutoOverride] = React.useState<{
    key: string;
    pathname: string;
  } | null>(null);

  React.useEffect(() => {
    let active = true;

    getDiscoverWeeks()
      .then((data) => {
        if (active) setWeeks(data);
      })
      .catch(() => {
        console.warn("Unable to load sidebar DISCOVER weeks.");
      });

    getFellowTeam()
      .then((team) => {
        if (active) setTeamName(team.name);
      })
      .catch(() => {
        if (active) setTeamName(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const orderedWeeks = React.useMemo(
    () => [...weeks].sort((left, right) => left.sequence - right.sequence),
    [weeks]
  );
  const induction = React.useMemo(
    () =>
      orderedWeeks
        .flatMap((week) => week.sessions)
        .find((session) => session.session_number === 0),
    [orderedWeeks]
  );

  const selectedSessionId = React.useMemo(() => {
    const match = pathname.match(/^\/sessions\/([^/]+)$/);
    return match?.[1] ?? null;
  }, [pathname]);

  const automaticSectionKey = React.useMemo(() => {
    if (selectedSessionId) {
      if (induction?.id === selectedSessionId) {
        return INDUCTION_SECTION_KEY;
      }

      const selectedWeek = orderedWeeks.find((week) =>
        week.sessions.some((session) => session.id === selectedSessionId)
      );
      if (selectedWeek) return weekSectionKey(selectedWeek);
    }

    const activeWeek = orderedWeeks.find((week) => week.status === "active");
    const fallbackWeek =
      activeWeek ??
      orderedWeeks.find((week) => week.week_number === 1) ??
      orderedWeeks[0];

    return fallbackWeek ? weekSectionKey(fallbackWeek) : null;
  }, [induction?.id, orderedWeeks, selectedSessionId]);

  const isSectionExpanded = React.useCallback(
    (key: string) => {
      if (manuallyExpanded.has(key)) return true;

      const autoCollapsedForThisRoute =
        collapsedAutoOverride?.key === key &&
        collapsedAutoOverride.pathname === pathname;

      return automaticSectionKey === key && !autoCollapsedForThisRoute;
    },
    [automaticSectionKey, collapsedAutoOverride, manuallyExpanded, pathname]
  );

  const toggleSection = React.useCallback(
    (key: string) => {
      const expanded = isSectionExpanded(key);

      if (expanded) {
        setManuallyExpanded((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });

        if (automaticSectionKey === key) {
          setCollapsedAutoOverride({ key, pathname });
        }
        return;
      }

      setManuallyExpanded((current) => new Set(current).add(key));
      setCollapsedAutoOverride((current) =>
        current?.key === key ? null : current
      );
    },
    [automaticSectionKey, isSectionExpanded, pathname]
  );

  const navigationGroups: Array<{
    title: string;
    items: Array<{
      name: string;
      href: string;
      icon: typeof Users;
      subtitle: string;
      badge?: string;
    }>;
  }> = [
      {
        title: "Collaboration",
        items: [
          {
            name: "Company Challenge",
            href: "/company-challenge",
            icon: BriefcaseBusiness,
            subtitle: "Your assigned business problem",
          },
          {
            name: "My Team",
            href: "/team",
            icon: Users,
            subtitle: "Collaborate with your Fellows",
            badge: teamName ?? undefined,
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
            subtitle: "Checklist & updates",
          },
          {
            name: "Profile & 2FA",
            href: "/profile",
            icon: ShieldCheck,
            subtitle: "Account & security",
          },
        ],
      },
    ];


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
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3 group">
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
              Fellow Portal
            </span>
          </div>
          <Badge variant="brand" size="sm" className="text-[10px]">
            Fellow
          </Badge>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-4">
        {/* DISCOVER Session Navigation */}
        <div
          className="space-y-2 rounded-2xl p-1"
          style={{
            background:
              "radial-gradient(circle at 10% 0%, color-mix(in srgb, var(--color-brand-orange) 7%, transparent), transparent 58%)",
          }}
        >
          <div>
            <Link
              href="/"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold transition-colors",
                pathname === "/"
                  ? "bg-[var(--color-brand-orange-subtle)] text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-body)] hover:bg-[var(--color-brand-orange-subtle)]"
              )}
            >
              <Compass className="w-4 h-4 text-[var(--color-brand-orange)]" />
              DISCOVER
            </Link>
          </div>

          {induction && (
            <div>
              {(() => {
                const sectionKey = INDUCTION_SECTION_KEY;
                const panelId = "discover-induction-panel";
                const expanded = isSectionExpanded(sectionKey);
                const state: SectionVisualState = !induction.is_unlocked
                  ? "locked"
                  : induction.status === "completed"
                    ? "completed"
                    : "upcoming";

                return (
                  <>
                    <AccordionHeader
                      panelId={panelId}
                      number="00"
                      label="Induction"
                      statusLabel={sessionStatusLabel(induction)}
                      state={state}
                      expanded={expanded}
                      onToggle={() => toggleSection(sectionKey)}
                    />
                    <AccordionPanel id={panelId} expanded={expanded}>
                      <SessionSidebarItem
                        session={induction}
                        selected={selectedSessionId === induction.id}
                        expanded={expanded}
                        onNavigate={onNavigate}
                      />
                    </AccordionPanel>
                  </>
                );
              })()}
            </div>
          )}

          {orderedWeeks.map((week) => {
            const sectionKey = weekSectionKey(week);
            const panelId = `discover-week-${week.week_number}-panel`;
            const expanded = isSectionExpanded(sectionKey);
            const sessions = [...week.sessions]
              .filter((session) => session.session_number !== 0)
              .sort((left, right) => left.sequence - right.sequence);
            const completedSessions = sessions.filter(
              (session) => session.status === "completed"
            ).length;

            return (
              <div key={week.id}>
                <AccordionHeader
                  panelId={panelId}
                  number={String(week.week_number).padStart(2, "0")}
                  label={`Week ${week.week_number}`}
                  title={week.title}
                  statusLabel={weekStatusLabel(week)}
                  state={weekVisualState(week)}
                  completion={`${completedSessions}/${sessions.length} done`}
                  expanded={expanded}
                  onToggle={() => toggleSection(sectionKey)}
                />
                <AccordionPanel id={panelId} expanded={expanded}>
                  {sessions.map((session) => (
                    <SessionSidebarItem
                      key={session.id}
                      session={session}
                      selected={selectedSessionId === session.id}
                      expanded={expanded}
                      onNavigate={onNavigate}
                    />
                  ))}
                </AccordionPanel>
              </div>
            );
          })}
        </div>
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <h4 className="flex items-center gap-2 px-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-orange)]" />
              {group.title}
            </h4>
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href === "/" && pathname === "/");

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex min-h-14 min-w-0 items-center gap-2.5 overflow-hidden rounded-xl border px-2.5 py-2 text-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)] focus-visible:ring-offset-1 motion-reduce:transform-none motion-reduce:transition-none",
                      isActive
                        ? "border-orange-200 text-[var(--color-text-primary)] shadow-sm"
                        : "border-[var(--color-border-default)] bg-white text-[var(--color-text-body)] hover:-translate-y-0.5 hover:border-orange-200 hover:bg-gradient-to-br hover:from-[var(--color-brand-orange-subtle)] hover:to-white hover:text-[var(--color-text-primary)] hover:shadow-sm"
                    )}
                    style={
                      isActive
                        ? {
                            background:
                              "linear-gradient(135deg, color-mix(in srgb, var(--color-brand-orange) 10%, white), white 75%)",
                          }
                        : undefined
                    }
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--color-brand-orange)]" />
                    )}

                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200 ease-out",
                        isActive
                          ? "border-orange-200 bg-[var(--color-brand-orange-subtle)] text-[var(--color-brand-orange)]"
                          : "border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] group-hover:border-orange-200 group-hover:bg-white group-hover:text-[var(--color-brand-orange)]"
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className="h-4 w-4"
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-bold leading-4 text-[var(--color-text-primary)]">
                        {item.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[9px] font-medium leading-3 text-[var(--color-text-muted)]">
                        {item.subtitle}
                      </span>
                    </span>

                    <span className="flex min-w-0 shrink-0 items-center gap-1">
                      {item.badge && (
                        <span className="max-w-14 truncate rounded-full border border-orange-100 bg-[var(--color-brand-orange-subtle)] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-[var(--color-brand-orange)]">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        aria-hidden="true"
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-all duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-[var(--color-brand-orange)] motion-reduce:transform-none motion-reduce:transition-none",
                          isActive
                            ? "text-[var(--color-brand-orange)]"
                            : "text-[var(--color-text-muted)]"
                        )}
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cohort & User Footer Info */}
      <div className="shrink-0 border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="w-2 h-2 shrink-0 rounded-full bg-[var(--color-success)]" />
            <span className="truncate text-xs font-semibold text-[var(--color-text-secondary)]">
              {context?.cohort.name ?? "Cohort"}
            </span>
          </div>
          <Badge variant="blue" size="sm" className="max-w-28 shrink-0 truncate">
            {context
              ? `${context.current_phase.name} (${context.current_phase.development_role})`
              : "Phase"}
          </Badge>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-border-default)] pt-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-navy)] text-[10px] font-bold text-white">
              {user ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() : "FL"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-[11px] font-bold leading-tight text-[var(--color-text-primary)]">
                {user ? `${user.first_name} ${user.last_name}` : "Fellow"}
              </span>
              <span className="truncate text-[9px] text-[var(--color-text-muted)]">
                {user?.two_factor_enabled ? "2FA Enabled" : "Active"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-brand-orange)] p-1.5 rounded-lg hover:bg-[var(--color-bg-subtle)] transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
