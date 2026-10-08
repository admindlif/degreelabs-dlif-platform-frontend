"use client";

import * as React from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Compass,
  Layers,
  Calendar,
  Video,
  BookOpen,
  FileCheck,
  Users2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  LogOut,
  RefreshCw,
  Shield,
  X,
  ArrowRight,
  Lock,
  Menu,
  Unlock,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  AdminCohort,
  AdminFellow,
  AdminPhase,
  AdminProgram,
  AdminResource,
  AdminSession,
  AdminStats,
  AdminTeam,
  AdminWeek,
  AdminChecklistItem,

  getAdminCohorts,
  getAdminFellows,
  getAdminPhases,
  getAdminPrograms,
  getAdminResources,
  getAdminSessions,
  getAdminStats,
  getAdminTeams,
  getAdminWeeks,
  getAdminChecklistItems,

  deleteCohort,
  deleteFellow,
  deletePhase,
  deleteProgram,
  deleteResource,
  deleteSession,
  deleteWeek,
  deleteChecklistItem,

  inviteFellow,
  unlockSession,
  lockSession,
  AdminSessionSubmissionItem,
  getAdminSessionSubmissions,
  updateChecklistItem,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/client";




import { ProgramModal } from "@/components/admin/program-modal";
import { CohortModal } from "@/components/admin/cohort-modal";
import { PhaseModal } from "@/components/admin/phase-modal";
import { WeekModal } from "@/components/admin/week-modal";
import { SessionModal } from "@/components/admin/session-modal";
import { TeamModal } from "@/components/admin/team-modal";
import { ResourceModal } from "@/components/admin/resource-modal";
import { CohortFellowsModal } from "@/components/admin/cohort-fellows-modal";
import { TeamMembersModal } from "@/components/admin/team-members-modal";
import { SubmissionFeedbackModal } from "@/components/admin/submission-feedback-modal";
import { TeamChallengeResourcesModal } from "@/components/admin/team-challenge-resources-modal";
import { ChecklistItemModal } from "@/components/admin/checklist-item-modal";

type NavTab =
  | "Dashboard"
  | "Fellows"
  | "Programs"
  | "Phases"
  | "Cohorts"
  | "Weeks"
  | "Sessions"
  | "Teams"
  | "Resources"
  | "Checklist"
  | "Weekly Outputs";

interface NavGroup {
  label: string;
  items: {
    name: NavTab;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export default function AdminHomePage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState<NavTab>("Dashboard");
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Live data states
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [fellows, setFellows] = React.useState<AdminFellow[]>([]);
  const [programs, setPrograms] = React.useState<AdminProgram[]>([]);

  // ADD THIS
  const [phases, setPhases] = React.useState<AdminPhase[]>([]);

  const [cohorts, setCohorts] = React.useState<AdminCohort[]>([]);
  const [weeks, setWeeks] = React.useState<AdminWeek[]>([]);
  const [sessions, setSessions] = React.useState<AdminSession[]>([]);
  const [resources, setResources] = React.useState<AdminResource[]>([]);
  const [teams, setTeams] = React.useState<AdminTeam[]>([]);
  const [checklistItems, setChecklistItems] = React.useState<AdminChecklistItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sessionCohortFilter, setSessionCohortFilter] =
    React.useState<string>("all");

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [inviteFirstName, setInviteFirstName] = React.useState("");
  const [inviteLastName, setInviteLastName] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteLoading, setInviteLoading] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = React.useState<string | null>(null);


  // Program modal state
  const [showProgramModal, setShowProgramModal] = React.useState(false);

  const [programModalMode, setProgramModalMode] =
    React.useState<"create" | "edit">("create");

  const [showCohortModal, setShowCohortModal] =
    React.useState(false);

  const [selectedCohort, setSelectedCohort] =
    React.useState<AdminCohort | null>(null);

  const [showCohortFellowsModal, setShowCohortFellowsModal] =
    React.useState(false);

  const [selectedCohortForFellows, setSelectedCohortForFellows] =
    React.useState<AdminCohort | null>(null);

  const [showWeekModal, setShowWeekModal] =
    React.useState(false);

  const [selectedWeek, setSelectedWeek] =
    React.useState<AdminWeek | null>(null);

  const [showPhaseModal, setShowPhaseModal] = React.useState(false);

  const [selectedPhase, setSelectedPhase] = React.useState<AdminPhase | null>(null);

  const [showSessionModal, setShowSessionModal] =
    React.useState(false);

  const [showTeamMembersModal, setShowTeamMembersModal] =
    React.useState(false);

  const [selectedTeamForMembers, setSelectedTeamForMembers] =
    React.useState<AdminTeam | null>(null);

  const [showTeamChallengeResourcesModal, setShowTeamChallengeResourcesModal] =
    React.useState(false);

  const [selectedTeamForChallengeResources, setSelectedTeamForChallengeResources] =
    React.useState<AdminTeam | null>(null);

  const [showTeamModal, setShowTeamModal] =
    React.useState(false);

  const [selectedTeam, setSelectedTeam] =
    React.useState<AdminTeam | null>(null);

  const [selectedSession, setSelectedSession] =
    React.useState<AdminSession | null>(null);

  const [showResourceModal, setShowResourceModal] =
    React.useState(false);

  const [selectedResource, setSelectedResource] =
    React.useState<AdminResource | null>(null);

  const [showChecklistItemModal, setShowChecklistItemModal] =
    React.useState(false);

  const [selectedChecklistItem, setSelectedChecklistItem] =
    React.useState<AdminChecklistItem | null>(null);

  const [selectedProgram, setSelectedProgram] =
    React.useState<AdminProgram | null>(null);

  const [weeklyOutputCohortId, setWeeklyOutputCohortId] =
    React.useState("");

  const [weeklyOutputSessionId, setWeeklyOutputSessionId] =
    React.useState("");

  const [weeklyOutputSubmissions, setWeeklyOutputSubmissions] =
    React.useState<AdminSessionSubmissionItem[]>([]);

  const [weeklyOutputLoading, setWeeklyOutputLoading] =
    React.useState(false);

  const [
    showSubmissionFeedbackModal,
    setShowSubmissionFeedbackModal,
  ] = React.useState(false);

  const [
    selectedSubmissionForFeedback,
    setSelectedSubmissionForFeedback,
  ] = React.useState<AdminSessionSubmissionItem | null>(null);

  const [weeklyOutputError, setWeeklyOutputError] =
    React.useState<string | null>(null);
  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [
        statsData,
        fellowsData,
        programsData,
        phasesData,
        cohortsData,
        weeksData,
        sessionsData,
        resourcesData,
        teamsData,
        checklistItemsData,
      ] = await Promise.all([
        getAdminStats().catch(() => null),
        getAdminFellows().catch(() => []),
        getAdminPrograms().catch(() => []),
        getAdminPhases().catch(() => []),
        getAdminCohorts().catch(() => []),
        getAdminWeeks().catch(() => []),
        getAdminSessions().catch(() => []),
        getAdminResources().catch(() => []),
        getAdminTeams().catch(() => []),
        getAdminChecklistItems().catch(() => []),
      ]);

      setStats(statsData);

      setFellows(fellowsData);
      setPrograms(programsData);
      setPhases(phasesData);
      setCohorts(cohortsData);
      setWeeks(weeksData);
      setSessions(sessionsData);
      setResources(resourcesData);
      setTeams(teamsData);
      setChecklistItems(checklistItemsData);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    setInviteLoading(true);

    try {
      const result = await inviteFellow({
        first_name: inviteFirstName.trim(),
        last_name: inviteLastName.trim(),
        email: inviteEmail.trim(),
      });
      setInviteFirstName("");
      setInviteLastName("");
      setInviteEmail("");
      loadData();
      if (result.invitation_sent) {
        setInviteSuccess(result.message);
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteSuccess(null);
        }, 2000);
      } else {
        setInviteError(result.message);
      }
    } catch (err: unknown) {
      setInviteError(getErrorMessage(err, "Failed to invite Fellow. Please verify details."));
    } finally {
      setInviteLoading(false);
    }
  };

  const navGroups: NavGroup[] = [
    {
      label: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          icon: LayoutDashboard,
        },
      ],
    },

    {
      label: "PEOPLE",
      items: [
        {
          name: "Fellows",
          icon: Users,
          badge:
            fellows.length > 0
              ? String(fellows.length)
              : undefined,
        },
      ],
    },

    {
      label: "PROGRAM",
      items: [
        {
          name: "Programs",
          icon: Compass,
        },
        {
          name: "Phases",
          icon: Layers,
        },
        {
          name: "Cohorts",
          icon: Layers,
          badge:
            cohorts.length > 0
              ? String(cohorts.length)
              : undefined,
        },
        {
          name: "Weeks",
          icon: Calendar,
        },
        {
          name: "Sessions",
          icon: Video,
        },
      ],
    },

    {
      label: "COLLABORATION",
      items: [
        {
          name: "Teams",
          icon: Users2,
          badge:
            teams.length > 0
              ? String(teams.length)
              : undefined,
        },
      ],
    },

    {
      label: "LEARNING",
      items: [
        {
          name: "Resources",
          icon: BookOpen,
        },
        {
          name: "Checklist",
          icon: ClipboardList,
          badge: checklistItems.length > 0 ? String(checklistItems.length) : undefined,
        },
        {
          name: "Weekly Outputs",
          icon: FileCheck,
        },
      ],
    },
  ];

  const filteredFellows = fellows.filter((f) => {
    const matchesSearch =
      f.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || f.account_status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });
  const filteredSessions =
    sessionCohortFilter === "all"
      ? sessions
      : sessions.filter(
        (session) => session.cohort_id === sessionCohortFilter
      );

  React.useEffect(() => {
    if (!weeklyOutputSessionId) return;

    let cancelled = false;

    void getAdminSessionSubmissions(weeklyOutputSessionId)
      .then((data) => {
        if (!cancelled) setWeeklyOutputSubmissions(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setWeeklyOutputError(
            getErrorMessage(err, "Unable to load Team submissions.")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setWeeklyOutputLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [weeklyOutputSessionId]);

  const activePhase =
    phases.find((phase) => phase.is_active) ?? null;

  const activeCohorts =
    cohorts.filter(
      (cohort) => cohort.status === "active"
    );

  const primaryCohort =
    activeCohorts[0] ?? null;

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-[min(256px,calc(100vw-3rem))] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[var(--color-brand-navy)] shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Brand Header */}
        <div className="h-20 flex items-center px-5 border-b border-white/10">
          <div className="relative w-36 h-9 flex items-center">
            <Image
              src="/degreelabs-logo.png"
              alt="DegreeLabs"
              width={160}
              height={36}
              className="object-contain brightness-0 invert"
              priority
            />
          </div>
        </div>

        {/* Portal Scope Badge */}
        <div className="px-5 pt-4 pb-2">
          <div className="bg-white/5 px-3 py-2 rounded-xl flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand-orange)] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
                Administration
              </span>
            </div>
            <span className="text-[10px] font-bold bg-[var(--color-brand-orange)] text-white px-2 py-0.5 rounded-full">
              Ops Console
            </span>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-5 admin-sidebar-scroll">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <h4 className="px-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
                {group.label}
              </h4>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.name;

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.name);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group text-left ${isActive
                        ? "bg-[var(--color-brand-blue)] text-white font-bold shadow-md shadow-blue-500/20"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-white/60"
                            }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive
                            ? "bg-white text-[var(--color-brand-blue)]"
                            : "bg-white/10 text-white/80"
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Admin Profile & Logout Footer */}
        <div className="px-5 py-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand-orange)]" />
              <span className="text-xs font-semibold text-white/80">
                Admin Console
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
              {user?.role?.toUpperCase() || "ADMIN"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[var(--color-brand-orange)] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                {user ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() : "AD"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white leading-tight truncate">
                  {user ? `${user.first_name} ${user.last_name}` : "DegreeLabs Admin"}
                </span>
                <span className="text-[10px] text-white/50 truncate">
                  {user?.email || "—"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-white/60 hover:text-[var(--color-brand-orange)] p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-3 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-[var(--color-text-secondary)] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
                <span>DegreeLabs DLIF</span>
                <span>/</span>
                <span className="text-[var(--color-text-primary)] font-bold">{activeTab}</span>
              </div>
              <h1 className="truncate text-xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                {activeTab}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs font-semibold text-[var(--color-text-body)] transition-all hover:border-[var(--color-border-strong)]"
              title="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--color-brand-blue)] px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-600 sm:px-4"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Invite Fellow</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="mx-auto w-full max-w-[1400px] space-y-8 p-4 sm:p-6 xl:p-8">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "Dashboard" && (
            <div className="space-y-8">
              {/* Hero Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] p-6 sm:p-8">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--color-brand-orange-subtle)] rounded-full blur-3xl pointer-events-none opacity-60" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-blue-subtle)] border border-[var(--color-brand-blue)]/20 text-xs font-bold text-[var(--color-brand-blue)] mb-3">
                      <span>DLIF Operations Console</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                      Welcome, {user?.first_name || "Administrator"}
                    </h2>
                    <p className="text-sm text-[var(--color-text-body)] mt-1 max-w-xl">
                      Manage cohorts, track Fellow progression across the DISCOVER phase, monitor team challenge alignment, and provision credentials.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("Fellows")}
                      className="min-h-10 flex-1 rounded-xl bg-[var(--color-brand-navy)] px-4 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 sm:flex-none"
                    >
                      Manage Fellows ({stats?.total_fellows ?? fellows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("Cohorts")}
                      className="min-h-10 flex-1 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-2.5 text-xs font-bold transition-all hover:border-[var(--color-border-strong)] sm:flex-none"
                    >
                      View Cohorts ({cohorts.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Total Fellows
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-blue-subtle)] text-[var(--color-brand-blue)] flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[var(--color-text-primary)]">
                    {stats?.total_fellows ?? fellows.length}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-muted)]">
                    <span className="text-[var(--color-success)] font-bold">
                      {stats?.active_fellows ?? fellows.filter((f) => f.account_status === "active").length} Active
                    </span>
                    <span>•</span>
                    <span>{stats?.invited_fellows ?? fellows.filter((f) => f.account_status === "invited").length} Pending</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Current Phase
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-orange-subtle)] text-[var(--color-brand-orange)] flex items-center justify-center">
                      <Compass className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-extrabold text-[var(--color-text-primary)]">
                    {activePhase
                      ? `${activePhase.name}${activePhase.development_role
                        ? ` (${activePhase.development_role})`
                        : ""
                      }`
                      : "Not configured"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--color-brand-orange)] font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {activePhase
                        ? `${activePhase.duration_weeks} Weeks configured`
                        : "Phase not configured"}
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Active Cohorts
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[var(--color-text-primary)]">
                    {activeCohorts.length}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-2">
                    {primaryCohort
                      ? `${primaryCohort.name}`
                      : "No active Cohort"}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Total Sessions
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Video className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[var(--color-text-primary)]">
                    {stats?.total_sessions ?? sessions.length}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-2">
                    {sessions.length > 0
                      ? `${sessions.length} Sessions configured`
                      : "No Sessions configured"}
                  </div>
                </div>
              </div>


              {/* Recent Fellows Quick Table */}
              <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold">Recently Enrolled Fellows</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {primaryCohort
                        ? `Fellows in ${primaryCohort.name}`
                        : "Recently added Fellows"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("Fellows")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-brand-blue)] hover:underline"
                  >
                    <span>View All Fellows</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-border-default)] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Fellow</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">2FA Security</th>
                        <th className="py-3 px-4">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-default)]">
                      {fellows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                            No Fellows are available.
                          </td>
                        </tr>
                      ) : fellows.slice(0, 5).map((f) => (
                        <tr key={f.id} className="hover:bg-[var(--color-bg-canvas)] transition-colors">
                          <td className="py-3 px-4 font-bold">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 shrink-0 rounded-full bg-[var(--color-brand-navy)] text-white text-[10px] font-bold flex items-center justify-center">
                                {f.first_name[0]}{f.last_name[0]}
                              </div>
                              <span>{f.first_name} {f.last_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[var(--color-text-body)]">{f.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${f.account_status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                            >
                              {f.account_status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium ${f.two_factor_enabled ? "text-emerald-600" : "text-[var(--color-text-muted)]"
                                }`}
                            >
                              <Shield className="w-3 h-3" />
                              {f.two_factor_enabled ? "2FA Enabled" : "Standard"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[var(--color-text-muted)]">
                            {f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FELLOWS */}
          {activeTab === "Fellows" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">Fellows Management</h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Manage enrollment, view onboarding statuses, and issue invitation links.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold hover:bg-blue-600 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Invite New Fellow</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="p-4 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)] text-xs focus:outline-none focus:border-[var(--color-brand-blue)]"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {["all", "active", "invited", "suspended"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors shrink-0 ${statusFilter === st
                        ? "bg-[var(--color-brand-navy)] text-white"
                        : "bg-[var(--color-bg-canvas)] text-[var(--color-text-body)] border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]"
                        }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fellows Data Table */}
              <div className="rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-xs">
                  <thead className="bg-[var(--color-bg-canvas)] border-b border-[var(--color-border-default)]">
                    <tr className="text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">Fellow Name</th>
                      <th className="py-3.5 px-4">Email Address</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">2FA State</th>
                      <th className="py-3.5 px-4">Enrolled On</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-default)]">
                    {filteredFellows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[var(--color-text-muted)]">
                          No fellows found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredFellows.map((f) => (
                        <tr key={f.id} className="hover:bg-[var(--color-bg-canvas)] transition-colors">
                          <td className="py-3 px-4 font-bold">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--color-brand-navy)] text-white text-xs font-bold flex items-center justify-center">
                                {f.first_name[0]}{f.last_name[0]}
                              </div>
                              <div>
                                <div>{f.first_name} {f.last_name}</div>
                                <span className="text-[10px] text-[var(--color-text-muted)] font-normal">
                                  ID: {f.id.substring(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[var(--color-text-body)]">{f.email}</td>
                          <td className="py-3 px-4 font-semibold text-[var(--color-brand-blue)]">
                            Fellow
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${f.account_status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : f.account_status === "invited"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                            >
                              {f.account_status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${f.two_factor_enabled ? "text-emerald-600" : "text-amber-600"
                                }`}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              {f.two_factor_enabled ? "2FA Verified" : "Pending Setup"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[var(--color-text-muted)]">
                            {f.created_at ? new Date(f.created_at).toLocaleDateString() : "Recent"}
                          </td>
                          <td className="py-3 px-4 text-right">

                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  alert(
                                    `Fellow Profile: ${f.first_name} ${f.last_name} (${f.email})`
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg border border-[var(--color-border-default)] hover:border-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue)] font-semibold transition-colors text-[11px]"
                              >
                                Details
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  const confirmed = window.confirm(
                                    `Are you sure you want to delete ${f.first_name} ${f.last_name}?`
                                  );

                                  if (!confirmed) {
                                    return;
                                  }

                                  try {
                                    await deleteFellow(f.id);
                                    await loadData();
                                  } catch (err: unknown) {
                                    window.alert(
                                      getErrorMessage(err, "Unable to delete Fellow.")
                                    );
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-semibold transition-colors text-[11px]"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
          {/* PHASES */}
          {activeTab === "Phases" && (
            <div className="space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold">
                    Phases
                  </h2>

                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Manage program phases such as DISCOVER.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPhase(null);
                    setShowPhaseModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold"
                >
                  <Plus className="w-4 h-4" />
                  Create Phase
                </button>
              </div>

              <div className="rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-xs">

                  <thead className="bg-[var(--color-bg-canvas)]">
                    <tr>
                      <th className="py-3 px-4">
                        Code
                      </th>

                      <th className="py-3 px-4">
                        Name
                      </th>

                      <th className="py-3 px-4">
                        Development Role
                      </th>

                      <th className="py-3 px-4">
                        Duration
                      </th>

                      <th className="py-3 px-4">
                        Status
                      </th>

                      <th className="py-3 px-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[var(--color-border-default)]">

                    {phases.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-10 text-center text-[var(--color-text-muted)]"
                        >
                          No phases found.
                        </td>
                      </tr>
                    ) : (
                      phases.map((phase) => (
                        <tr key={phase.id}>

                          <td className="py-3 px-4 font-bold text-[var(--color-brand-blue)]">
                            {phase.code}
                          </td>

                          <td className="py-3 px-4 font-bold">
                            {phase.name}
                          </td>

                          <td className="py-3 px-4">
                            {phase.development_role}
                          </td>

                          <td className="py-3 px-4">
                            {phase.duration_weeks} Weeks
                          </td>

                          <td className="py-3 px-4">
                            {phase.is_active
                              ? "Active"
                              : "Inactive"}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPhase(phase);
                                  setShowPhaseModal(true);
                                }}
                                className="px-3 py-1.5 rounded-lg border border-[var(--color-border-default)] font-semibold"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  if (
                                    !window.confirm(
                                      `Delete phase "${phase.name}"?`
                                    )
                                  ) {
                                    return;
                                  }

                                  try {
                                    await deletePhase(
                                      phase.id
                                    );

                                    await loadData();
                                  } catch (err: unknown) {
                                    window.alert(
                                      getErrorMessage(err, "Unable to delete phase.")
                                    );
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 font-semibold"
                              >
                                Delete
                              </button>

                            </div>
                          </td>

                        </tr>
                      ))
                    )}

                  </tbody>
                </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: COHORTS */}
          {activeTab === "Cohorts" && (
            <div className="space-y-6">

              {/* Cohort Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    Cohorts & Schedules
                  </h2>

                  <p className="text-xs text-[var(--color-text-muted)]">
                    Active and archived DLIF fellowship cohort cycles.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCohort(null);
                    setShowCohortModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold hover:bg-blue-600 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Cohort</span>
                </button>
              </div>

              {/* Cohort Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {cohorts.length === 0 ? (
                  <div className="md:col-span-2 p-8 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-center text-sm text-[var(--color-text-muted)]">
                    No cohorts found.
                  </div>
                ) : (
                  cohorts.map((cohort) => (
                    <div
                      key={cohort.id}
                      className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] space-y-4"
                    >

                      {/* Code + Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-blue)]">
                          {cohort.code}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${cohort.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : cohort.status === "upcoming"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : cohort.status === "completed"
                                ? "bg-gray-100 text-gray-700 border border-gray-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                        >
                          {cohort.status}
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className="text-lg font-bold">
                        {cohort.name}
                      </h3>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)]">
                          <span className="text-[var(--color-text-muted)]">
                            Enrolled Fellows
                          </span>

                          <div className="text-base font-extrabold mt-0.5">
                            {cohort.participant_count ?? 0} Fellows
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)]">
                          <span className="text-[var(--color-text-muted)]">
                            Status
                          </span>

                          <div className="text-base font-extrabold text-[var(--color-brand-orange)] mt-0.5 capitalize">
                            {cohort.status}
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="text-xs text-[var(--color-text-muted)] space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />

                          <span>
                            Start Date:{" "}
                            {cohort.start_date
                              ? new Date(cohort.start_date).toLocaleDateString()
                              : "Not set"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />

                          <span>
                            End Date:{" "}
                            {cohort.end_date
                              ? new Date(cohort.end_date).toLocaleDateString()
                              : "Not set"}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-default)]">

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCohortForFellows(cohort);
                            setShowCohortFellowsModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[var(--color-brand-blue)] text-white text-xs font-semibold"
                        >
                          Manage Fellows
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCohort(cohort);
                            setShowCohortModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-[var(--color-border-default)] text-xs font-semibold hover:border-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue)] transition-colors"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed = window.confirm(
                              `Are you sure you want to delete "${cohort.name}"?`
                            );

                            if (!confirmed) {
                              return;
                            }

                            try {
                              await deleteCohort(cohort.id);
                              await loadData();
                            } catch (err: unknown) {
                              window.alert(
                                getErrorMessage(err, "Unable to delete cohort.")
                              );
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>

                      </div>
                    </div>
                  ))
                )}

              </div>
            </div>
          )}
          {/* TAB 4: PROGRAMS */}
          {activeTab === "Programs" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    Programs
                  </h2>

                  <p className="text-xs text-[var(--color-text-muted)]">
                    Create and manage DegreeLabs fellowship programs.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedProgram(null);
                    setProgramModalMode("create");
                    setShowProgramModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold hover:bg-blue-600 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Program</span>
                </button>
              </div>

              {/* Programs Table */}
              <div className="rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left text-xs">
                    <thead className="bg-[var(--color-bg-canvas)] border-b border-[var(--color-border-default)]">
                      <tr className="text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
                        <th className="py-3.5 px-4">
                          Program
                        </th>

                        <th className="py-3.5 px-4">
                          Code
                        </th>

                        <th className="py-3.5 px-4">
                          Status
                        </th>

                        <th className="py-3.5 px-4">
                          Description
                        </th>

                        <th className="py-3.5 px-4 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--color-border-default)]">
                      {programs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-10 text-center text-[var(--color-text-muted)]"
                          >
                            No programs found.
                          </td>
                        </tr>
                      ) : (
                        programs.map((program) => (
                          <tr
                            key={program.id}
                            className="hover:bg-[var(--color-bg-canvas)] transition-colors"
                          >
                            {/* Program Name */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-[var(--color-text-primary)]">
                                {program.name}
                              </div>

                              <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                                ID: {program.id.substring(0, 8)}...
                              </div>
                            </td>

                            {/* Code */}
                            <td className="py-3 px-4">
                              <span className="font-bold text-[var(--color-brand-blue)]">
                                {program.code}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${program.is_active
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-gray-100 text-gray-600 border border-gray-200"
                                  }`}
                              >
                                {program.is_active
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            {/* Description */}
                            <td className="py-3 px-4 text-[var(--color-text-muted)] max-w-md">
                              {program.description || "—"}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-2">
                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedProgram(program);
                                    setProgramModalMode("edit");
                                    setShowProgramModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-[var(--color-border-default)] font-semibold hover:border-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue)] transition-colors"
                                >
                                  Edit
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const confirmed = window.confirm(
                                      `Are you sure you want to delete "${program.name}"?`
                                    );

                                    if (!confirmed) {
                                      return;
                                    }

                                    try {
                                      await deleteProgram(program.id);
                                      await loadData();
                                    } catch (err: unknown) {
                                      window.alert(
                                        getErrorMessage(err, "Unable to delete program.")
                                      );
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {/* TAB 5: TEAMS */}
          {activeTab === "Teams" && (
            <div className="space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    Fellow Teams & Company Challenges
                  </h2>

                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Fellow team groupings and their assigned industry challenges.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTeam(null);
                    setShowTeamModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold"
                >
                  <Plus className="w-4 h-4" />
                  Create Team
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {teams.length === 0 ? (
                  <div className="md:col-span-2 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-10 text-center">
                    <h3 className="text-sm font-bold">
                      No Teams created yet
                    </h3>

                    <p className="text-xs text-[var(--color-text-muted)] mt-2">
                      Create a Team first, then add Fellows and assign a Team Lead.
                    </p>
                  </div>
                ) : (
                  teams.map((t) => (
                    <div
                      key={t.id}
                      className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] space-y-4"
                    >

                      <div className="flex items-center justify-between">
                        <span className="text-base font-extrabold">
                          Team {t.name}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-brand-blue-subtle)] text-[var(--color-brand-blue)]">
                          {t.member_count} Fellows
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                          Assigned Company Challenge
                        </span>

                        <div className="text-sm font-bold text-[var(--color-text-primary)] mt-1">
                          {t.company_challenge || "Not assigned"}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-default)]">

                        <span className="text-xs text-[var(--color-text-muted)]">
                          {t.member_count} Team Members
                        </span>

                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeam(t);
                              setShowTeamModal(true);
                            }}
                            className="px-3 py-2 rounded-lg border border-[var(--color-border-default)] text-xs font-bold"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeamForChallengeResources(t);
                              setShowTeamChallengeResourcesModal(true);
                            }}
                            className="px-3 py-2 rounded-lg border border-[var(--color-border-default)] text-xs font-bold hover:border-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue)]"
                          >
                            Challenge Resources
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeamForMembers(t);
                              setShowTeamMembersModal(true);
                            }}
                            className="px-3 py-2 rounded-lg border border-[var(--color-border-default)] text-xs font-bold hover:border-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue)]"
                          >
                            Manage Team
                          </button>

                        </div>
                      </div>

                    </div>
                  ))
                )}

              </div>
            </div>
          )}

          {/* TAB 6: WEEKS */}
          {activeTab === "Weeks" && (
            <div className="space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    Weeks
                  </h2>

                  <p className="text-xs text-[var(--color-text-muted)]">
                    Manage weekly curriculum structure and unlock schedules.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedWeek(null);
                    setShowWeekModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold hover:bg-blue-600 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Week</span>
                </button>
              </div>

              <div className="rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-xs">

                  <thead className="bg-[var(--color-bg-canvas)] border-b border-[var(--color-border-default)]">
                    <tr className="text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">Week</th>
                      <th className="py-3.5 px-4">Title</th>
                      <th className="py-3.5 px-4">
                        Strategic Question
                      </th>
                      <th className="py-3.5 px-4">Sequence</th>
                      <th className="py-3.5 px-4">Unlock</th>
                      <th className="py-3.5 px-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[var(--color-border-default)]">
                    {weeks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-10 text-center text-[var(--color-text-muted)]"
                        >
                          No weeks found.
                        </td>
                      </tr>
                    ) : (
                      weeks.map((week) => (
                        <tr
                          key={week.id}
                          className="hover:bg-[var(--color-bg-canvas)]"
                        >
                          <td className="py-3 px-4 font-bold text-[var(--color-brand-orange)]">
                            Week {week.week_number}
                          </td>

                          <td className="py-3 px-4 font-bold">
                            {week.title}
                          </td>

                          <td className="py-3 px-4 text-[var(--color-text-muted)]">
                            {week.strategic_question || "—"}
                          </td>

                          <td className="py-3 px-4">
                            {week.sequence}
                          </td>

                          <td className="py-3 px-4">
                            {week.unlock_at
                              ? new Date(
                                week.unlock_at
                              ).toLocaleString()
                              : "Not scheduled"}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWeek(week);
                                  setShowWeekModal(true);
                                }}
                                className="px-3 py-1.5 rounded-lg border border-[var(--color-border-default)] font-semibold hover:text-[var(--color-brand-blue)]"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  if (
                                    !window.confirm(
                                      `Delete Week ${week.week_number} - "${week.title}"?`
                                    )
                                  ) {
                                    return;
                                  }

                                  try {
                                    await deleteWeek(week.id);
                                    await loadData();
                                  } catch (err: unknown) {
                                    window.alert(
                                      getErrorMessage(err, "Unable to delete week.")
                                    );
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                </table>
                </div>
              </div>
            </div>
          )}

          {/* SESSIONS */}
          {activeTab === "Sessions" && (
            <div className="space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold">
                    Sessions
                  </h2>

                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Create, schedule and manage Fellowship sessions.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="sr-only" htmlFor="session-cohort-filter">
                    Filter Sessions by Cohort
                  </label>
                  <select
                    id="session-cohort-filter"
                    value={sessionCohortFilter}
                    onChange={(event) =>
                      setSessionCohortFilter(event.target.value)
                    }
                    className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2 text-xs font-semibold"
                  >
                    <option value="all">All Cohorts</option>
                    {cohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSession(null);
                      setShowSessionModal(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    Create Session
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-xs">

                  <thead className="bg-[var(--color-bg-canvas)] border-b">
                    <tr>
                      <th className="py-3 px-4">Session</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Week</th>
                      <th className="py-3 px-4">Date / Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[var(--color-border-default)]">

                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-10 text-center text-[var(--color-text-muted)]"
                        >
                          No sessions found for the selected Cohort.
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map((session) => {
                        const week = weeks.find(
                          (w) => w.id === session.week_id
                        );

                        return (
                          <tr key={session.id}>

                            <td className="py-3 px-4 font-bold">
                              Session {session.session_number}
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-bold">
                                {session.title}
                              </div>

                              <div className="text-[10px] text-[var(--color-text-muted)]">
                                {session.session_type}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {week
                                ? `Week ${week.week_number}`
                                : "Session 0 / No Week"}
                            </td>

                            <td className="py-3 px-4">
                              {session.start_at
                                ? new Date(
                                  session.start_at
                                ).toLocaleString()
                                : "Schedule not announced"}
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-1">
                                <span className="capitalize">
                                  {session.status}
                                </span>

                                <span
                                  className={`inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-bold ${session.is_unlocked
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-7 00 border border-amber-200"
                                    }`}
                                >
                                  {session.is_unlocked ? (
                                    <>
                                      <Unlock className="w-3 h-3" />
                                      Unlocked
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-3 h-3" />
                                      Locked
                                    </>
                                  )}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex justify-end gap-2">
                                {session.is_unlocked ? (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (
                                        !window.confirm(
                                          `Lock Session ${session.session_number}? Fellows will lose access to this Session and its content.`
                                        )
                                      ) {
                                        return;
                                      }

                                      try {
                                        await lockSession(session.id);
                                        await loadData();
                                      } catch (err: unknown) {
                                        window.alert(
                                          getErrorMessage(err, "Unable to lock session.")
                                        );
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 font-semibold"
                                  >
                                    Lock
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (
                                        !window.confirm(
                                          `Unlock Session ${session.session_number}? Fellows will gain access to this Session and its content.`
                                        )
                                      ) {
                                        return;
                                      }

                                      try {
                                        await unlockSession(session.id);
                                        await loadData();
                                      } catch (err: unknown) {
                                        window.alert(
                                          getErrorMessage(err, "Unable to unlock session.")
                                        );
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 font-semibold"
                                  >
                                    Unlock
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSession(session);
                                    setShowSessionModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg border font-semibold"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (
                                      !window.confirm(
                                        `Delete "${session.title}"?`
                                      )
                                    ) {
                                      return;
                                    }

                                    try {
                                      await deleteSession(session.id);
                                      await loadData();
                                    } catch (err: unknown) {
                                      window.alert(
                                        getErrorMessage(err, "Unable to delete session.")
                                      );
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 font-semibold"
                                >
                                  Delete
                                </button>

                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}

                  </tbody>
                </table>
                </div>
              </div>

            </div>
          )}

          {/* RESOURCES */}
          {activeTab === "Resources" && (
            <div className="space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold">
                    Resources
                  </h2>

                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Manage DISCOVER toolkit and Session-specific resources.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedResource(null);
                    setShowResourceModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold"
                >
                  <Plus className="w-4 h-4" />
                  Add Resource
                </button>
              </div>


              <div className="rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-xs">

                  <thead className="bg-[var(--color-bg-canvas)] border-b">
                    <tr>
                      <th className="py-3 px-4">
                        Resource
                      </th>

                      <th className="py-3 px-4">
                        Scope
                      </th>

                      <th className="py-3 px-4">
                        Type
                      </th>

                      <th className="py-3 px-4">
                        Status
                      </th>

                      <th className="py-3 px-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>


                  <tbody className="divide-y divide-[var(--color-border-default)]">

                    {resources.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-10 text-center text-[var(--color-text-muted)]"
                        >
                          No resources added yet.
                        </td>
                      </tr>
                    ) : (
                      resources.map((resource) => {
                        const session = resource.session_id
                          ? sessions.find(
                            (item) =>
                              item.id === resource.session_id
                          )
                          : null;

                        const cohort = session
                          ? cohorts.find(
                            (item) =>
                              item.id === session.cohort_id
                          )
                          : null;

                        return (
                          <tr key={resource.id}>

                            <td className="py-3 px-4">
                              <div className="font-bold">
                                {resource.title}
                              </div>

                              {resource.subtitle && (
                                <div className="text-[10px] text-[var(--color-text-muted)] mt-1">
                                  {resource.subtitle}
                                </div>
                              )}

                              {resource.url && (
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 mt-1 text-[10px] text-[var(--color-brand-blue)]"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Open
                                </a>
                              )}
                            </td>


                            <td className="py-3 px-4">
                              {session ? (
                                <div>
                                  <div className="font-semibold">
                                    Session {session.session_number}
                                  </div>

                                  <div className="text-[10px] text-[var(--color-text-muted)]">
                                    {cohort?.name ?? "Cohort"} — {session.title}
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                                  Phase Toolkit
                                </span>
                              )}
                            </td>


                            <td className="py-3 px-4 capitalize">
                              {resource.resource_type}
                            </td>


                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold ${resource.is_active
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                                  }`}
                              >
                                {resource.is_active
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>


                            <td className="py-3 px-4">
                              <div className="flex justify-end gap-2">

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedResource(resource);
                                    setShowResourceModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-[var(--color-border-default)] font-semibold"
                                >
                                  Edit
                                </button>


                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (
                                      !window.confirm(
                                        `Delete "${resource.title}"?`
                                      )
                                    ) {
                                      return;
                                    }

                                    try {
                                      await deleteResource(
                                        resource.id
                                      );

                                      await loadData();
                                    } catch (err: unknown) {
                                      window.alert(
                                        getErrorMessage(err, "Unable to delete Resource.")
                                      );
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 font-semibold"
                                >
                                  Delete
                                </button>

                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}

                  </tbody>
                </table>
                </div>
              </div>

            </div>
          )}

          {/* CHECKLIST */}
          {activeTab === "Checklist" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold">Fellow Checklist</h2>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Manage dynamic Fellow actions and target them by program scope.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChecklistItem(null);
                    setShowChecklistItemModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-blue)] px-4 py-2 text-xs font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create Checklist Item
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-xs">
                    <thead className="border-b bg-[var(--color-bg-canvas)]">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Scope</th>
                        <th className="px-4 py-3">Due</th>
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-default)]">
                      {checklistItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-text-muted)]">
                            No checklist items have been created.
                          </td>
                        </tr>
                      ) : (
                        checklistItems.map((item) => {
                          const cohort = cohorts.find((entry) => entry.id === item.cohort_id);
                          const phase = phases.find((entry) => entry.id === item.phase_id);
                          const week = weeks.find((entry) => entry.id === item.week_id);
                          const session = sessions.find((entry) => entry.id === item.session_id);
                          const scopes = [
                            cohort?.name,
                            phase?.name,
                            week ? `Week ${week.week_number}` : null,
                            session ? `Session ${session.session_number}` : null,
                          ].filter(Boolean);

                          return (
                            <tr key={item.id}>
                              <td className="max-w-sm px-4 py-3">
                                <div className="font-bold">{item.title}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
                                  {item.category && <span>{item.category}</span>}
                                  {item.category && item.is_required && <span>•</span>}
                                  {item.is_required && <span>Required</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {scopes.length > 0 ? scopes.join(" › ") : "All Fellows"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                {item.due_at ? new Date(item.due_at).toLocaleString() : "No due date"}
                              </td>
                              <td className="px-4 py-3">{item.sequence}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                  {item.is_active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await updateChecklistItem(item.id, {
                                          is_active: !item.is_active,
                                        });
                                        await loadData();
                                      } catch (err: unknown) {
                                        window.alert(getErrorMessage(err, "Unable to change checklist item status."));
                                      }
                                    }}
                                    className="rounded-lg border border-[var(--color-border-default)] px-3 py-1.5 font-semibold"
                                  >
                                    {item.is_active ? "Deactivate" : "Activate"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedChecklistItem(item);
                                      setShowChecklistItemModal(true);
                                    }}
                                    className="rounded-lg border border-[var(--color-border-default)] px-3 py-1.5 font-semibold"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!window.confirm(`Delete "${item.title}"? Items with completion history will be deactivated instead.`)) return;
                                      try {
                                        await deleteChecklistItem(item.id);
                                        await loadData();
                                      } catch (err: unknown) {
                                        window.alert(getErrorMessage(err, "Unable to delete checklist item."));
                                      }
                                    }}
                                    className="rounded-lg border border-red-200 px-3 py-1.5 font-semibold text-red-600"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* WEEKLY OUTPUTS */}
          {activeTab === "Weekly Outputs" && (
            <div className="space-y-6">

              <div>
                <h2 className="text-xl font-extrabold">
                  Team Submissions
                </h2>

                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Review Team submissions for each DISCOVER Session.
                </p>
              </div>

              {/* FILTERS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Cohort
                  </label>

                  <select
                    value={weeklyOutputCohortId}
                    onChange={(e) => {
                      setWeeklyOutputCohortId(
                        e.target.value
                      );

                      setWeeklyOutputSessionId("");
                      setWeeklyOutputSubmissions([]);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)]"
                  >
                    <option value="">
                      Select Cohort
                    </option>

                    {cohorts.map((cohort) => (
                      <option
                        key={cohort.id}
                        value={cohort.id}
                      >
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                </div>


                <div>
                  <label className="block text-xs font-bold mb-1">
                    Session
                  </label>

                  <select
                    value={weeklyOutputSessionId}
                    disabled={!weeklyOutputCohortId}
                    onChange={(e) => {
                      const sessionId = e.target.value;
                      setWeeklyOutputSessionId(sessionId);
                      setWeeklyOutputSubmissions([]);
                      setWeeklyOutputError(null);
                      setWeeklyOutputLoading(Boolean(sessionId));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] disabled:opacity-50"
                  >
                    <option value="">
                      Select Session
                    </option>

                    {sessions
                      .filter(
                        (session) =>
                          session.cohort_id ===
                          weeklyOutputCohortId
                      )
                      .sort(
                        (a, b) =>
                          a.session_number -
                          b.session_number
                      )
                      .map((session) => (
                        <option
                          key={session.id}
                          value={session.id}
                        >
                          Session {session.session_number} —{" "}
                          {session.title}
                        </option>
                      ))}
                  </select>
                </div>

              </div>


              {/* NO SESSION */}
              {!weeklyOutputSessionId && (
                <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-10 text-center text-sm text-[var(--color-text-muted)]">
                  Select a Cohort and Session to view Team submissions.
                </div>
              )}


              {/* LOADING */}
              {weeklyOutputSessionId &&
                weeklyOutputLoading && (
                  <div className="rounded-2xl border p-10 text-center text-sm text-[var(--color-text-muted)]">
                    Loading Team submissions...
                  </div>
                )}


              {/* ERROR */}
              {weeklyOutputError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {weeklyOutputError}
                </div>
              )}


              {/* SUBMISSIONS */}
              {weeklyOutputSessionId &&
                !weeklyOutputLoading &&
                !weeklyOutputError && (
                  <div className="rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-xs">

                      <thead className="bg-[var(--color-bg-canvas)] border-b">
                        <tr>
                          <th className="py-3 px-4">
                            Team
                          </th>

                          <th className="py-3 px-4">
                            Team Lead
                          </th>

                          <th className="py-3 px-4">
                            Status
                          </th>

                          <th className="py-3 px-4">
                            Submitted
                          </th>

                          <th className="py-3 px-4 text-right">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[var(--color-border-default)]">

                        {weeklyOutputSubmissions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-10 text-center text-[var(--color-text-muted)]"
                            >
                              No Teams found for this Session&apos;s Cohort.
                            </td>
                          </tr>
                        ) : (
                          weeklyOutputSubmissions.map(
                            (item) => (
                              <tr key={item.team_id}>

                                <td className="py-4 px-4 font-bold">
                                  Team {item.team_name}
                                </td>

                                <td className="py-4 px-4">
                                  {item.team_lead_name ||
                                    "No Team Lead assigned"}
                                </td>

                                <td className="py-4 px-4">
                                  {item.submission ? (
                                    <span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                      Submitted
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                      Not Submitted
                                    </span>
                                  )}
                                </td>

                                <td className="py-4 px-4 text-[var(--color-text-muted)]">
                                  {item.submission
                                    ? new Date(
                                      item.submission.submitted_at
                                    ).toLocaleString()
                                    : "—"}
                                </td>

                                <td className="py-4 px-4">
                                  <div className="flex justify-end gap-2">

                                    {item.submission ? (
                                      <>
                                        <a
                                          href={item.submission.drive_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border-default)] text-xs font-bold hover:border-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue)]"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                          Open Submission
                                        </a>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedSubmissionForFeedback(item);
                                            setShowSubmissionFeedbackModal(true);
                                          }}
                                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-brand-blue)] text-white text-xs font-bold"
                                        >
                                          <FileCheck className="w-3.5 h-3.5" />
                                          Review Feedback
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-[var(--color-text-muted)]">
                                        —
                                      </span>
                                    )}

                                  </div>
                                </td>

                              </tr>
                            )
                          )
                        )}

                      </tbody>
                    </table>
                    </div>
                  </div>
                )}

            </div>
          )}
        </main>
      </div>

      {/* ── INVITE FELLOW MODAL ────────────────────────────────────────── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">
                Invite New Fellow
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Send an invitation link with 2FA setup onboarding to a new fellow.
              </p>
            </div>

            {inviteSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{inviteSuccess}</span>
              </div>
            )}

            {inviteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)] focus:outline-none focus:border-[var(--color-brand-blue)]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)] focus:outline-none focus:border-[var(--color-brand-blue)]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)] focus:outline-none focus:border-[var(--color-brand-blue)]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border-default)] text-xs font-semibold hover:bg-[var(--color-bg-canvas)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {inviteLoading ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showProgramModal && (
        <ProgramModal
          mode={programModalMode}
          program={selectedProgram}
          onClose={() => {
            setShowProgramModal(false);
            setSelectedProgram(null);
          }}
          onSaved={async () => {
            setShowProgramModal(false);
            setSelectedProgram(null);

            await loadData();
          }}
        />
      )}

      {showCohortModal && (
        <CohortModal
          cohort={selectedCohort}
          programs={programs}
          onClose={() => {
            setShowCohortModal(false);
            setSelectedCohort(null);
          }}
          onSaved={async () => {
            setShowCohortModal(false);
            setSelectedCohort(null);
            await loadData();
          }}
        />
      )}

      {showWeekModal && (
        <WeekModal
          week={selectedWeek}
          phases={phases}
          onClose={() => {
            setShowWeekModal(false);
            setSelectedWeek(null);
          }}
          onSaved={async () => {
            setShowWeekModal(false);
            setSelectedWeek(null);
            await loadData();
          }}
        />
      )}
      {showPhaseModal && (
        <PhaseModal
          phase={selectedPhase}
          programs={programs}
          onClose={() => {
            setShowPhaseModal(false);
            setSelectedPhase(null);
          }}
          onSaved={async () => {
            setShowPhaseModal(false);
            setSelectedPhase(null);
            await loadData();
          }}
        />
      )}

      {showSessionModal && (
        <SessionModal
          session={selectedSession}
          cohorts={cohorts}
          phases={phases}
          weeks={weeks}
          sessions={sessions}
          onClose={() => {
            setShowSessionModal(false);
            setSelectedSession(null);
          }}
          onSaved={async () => {
            setShowSessionModal(false);
            setSelectedSession(null);
            await loadData();
          }}
        />
      )}

      {showResourceModal && (
        <ResourceModal
          resource={selectedResource}
          phases={phases}
          sessions={sessions}
          cohorts={cohorts}
          onClose={() => {
            setShowResourceModal(false);
            setSelectedResource(null);
          }}
          onSaved={async () => {
            setShowResourceModal(false);
            setSelectedResource(null);

            await loadData();
          }}
        />
      )}

      {showChecklistItemModal && (
        <ChecklistItemModal
          item={selectedChecklistItem}
          cohorts={cohorts}
          phases={phases}
          weeks={weeks}
          sessions={sessions}
          onClose={() => {
            setShowChecklistItemModal(false);
            setSelectedChecklistItem(null);
          }}
          onSaved={async () => {
            setShowChecklistItemModal(false);
            setSelectedChecklistItem(null);
            await loadData();
          }}
        />
      )}

      {showCohortFellowsModal && selectedCohortForFellows && (
        <CohortFellowsModal
          cohort={selectedCohortForFellows}
          fellows={fellows}
          onClose={() => {
            setShowCohortFellowsModal(false);
            setSelectedCohortForFellows(null);
          }}
          onSaved={async () => {
            await loadData();
          }}
        />
      )}

      {showTeamMembersModal && selectedTeamForMembers && (
        <TeamMembersModal
          team={selectedTeamForMembers}
          onClose={() => {
            setShowTeamMembersModal(false);
            setSelectedTeamForMembers(null);
          }}
          onChanged={async () => {
            await loadData();
          }}
        />
      )}

      {showTeamChallengeResourcesModal &&
        selectedTeamForChallengeResources && (
          <TeamChallengeResourcesModal
            team={selectedTeamForChallengeResources}
            onClose={() => {
              setShowTeamChallengeResourcesModal(false);
              setSelectedTeamForChallengeResources(null);
            }}
          />
        )}


      {showTeamModal && (
        <TeamModal
          team={selectedTeam}
          cohorts={cohorts}
          onClose={() => {
            setShowTeamModal(false);
            setSelectedTeam(null);
          }}
          onSaved={async () => {
            setShowTeamModal(false);
            setSelectedTeam(null);
            await loadData();
          }}
        />
      )}

      {showSubmissionFeedbackModal &&
        selectedSubmissionForFeedback &&
        selectedSubmissionForFeedback.submission && (
          <SubmissionFeedbackModal
            submissionId={
              selectedSubmissionForFeedback.submission.id
            }
            teamName={
              selectedSubmissionForFeedback.team_name
            }
            teamLeadName={
              selectedSubmissionForFeedback.team_lead_name
            }
            onClose={() => {
              setShowSubmissionFeedbackModal(false);
              setSelectedSubmissionForFeedback(null);
            }}
            onSaved={async () => {
              setShowSubmissionFeedbackModal(false);
              setSelectedSubmissionForFeedback(null);

              if (weeklyOutputSessionId) {
                const data =
                  await getAdminSessionSubmissions(
                    weeklyOutputSessionId
                  );

                setWeeklyOutputSubmissions(data);
              }
            }}
          />
        )}

    </div>
  );
}
