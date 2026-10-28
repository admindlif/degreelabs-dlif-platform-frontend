"use client";

import * as React from "react";
import {
  ExternalLink,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Layers,
  Calendar,
  Video,
  Users2,
  Check,
  X,
  Globe,
  Lock,
} from "lucide-react";
import {
  AdminCohort,
  AdminTeam,
  AdminWeek,
  AdminSession,
  AdminWorkingBoardDetail,
  getAdminWorkingBoards,
  createAdminWorkingBoard,
  updateAdminWorkingBoard,
  patchAdminWorkingBoardPublication,
} from "@/lib/api/admin";

interface WorkingBoardManagementTabProps {
  cohorts: AdminCohort[];
  weeks: AdminWeek[];
  sessions: AdminSession[];
  teams: AdminTeam[];
}

export function WorkingBoardManagementTab({
  cohorts,
  weeks,
  sessions,
  teams,
}: WorkingBoardManagementTabProps) {
  const [workingBoards, setWorkingBoards] = React.useState<AdminWorkingBoardDetail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  // Filter state for list
  const [filterCohortId, setFilterCohortId] = React.useState<string>("all");
  const [filterTeamId, setFilterTeamId] = React.useState<string>("all");
  const [filterSessionId, setFilterSessionId] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Form selection state
  const [selectedCohortId, setSelectedCohortId] = React.useState<string>("");
  const [selectedWeekId, setSelectedWeekId] = React.useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = React.useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>("");

  // Form field state
  const [editingBoardId, setEditingBoardId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState<string>("Working Board");
  const [workingBoardUrl, setWorkingBoardUrl] = React.useState<string>("");
  const [instructions, setInstructions] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Load working boards
  const loadBoards = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cohortParam = filterCohortId !== "all" ? filterCohortId : undefined;
      const teamParam = filterTeamId !== "all" ? filterTeamId : undefined;
      const sessionParam = filterSessionId !== "all" ? filterSessionId : undefined;
      const data = await getAdminWorkingBoards(sessionParam, teamParam, cohortParam);
      setWorkingBoards(data);
    } catch (err) {
      console.error("Failed to load working boards:", err);
      setError("Failed to load Working Boards. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [filterCohortId, filterTeamId, filterSessionId]);

  React.useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  // Dependent dropdown filters for form
  const availableWeeks = React.useMemo(() => {
    if (!selectedCohortId) return [];
    const cohort = cohorts.find((c) => c.id === selectedCohortId);
    if (!cohort?.program_id) return weeks;
    // Or filter weeks by phases in this cohort
    return weeks;
  }, [selectedCohortId, cohorts, weeks]);

  const availableSessions = React.useMemo(() => {
    if (!selectedCohortId) return [];
    return sessions.filter((s) => {
      const matchesCohort = s.cohort_id === selectedCohortId;
      const matchesWeek = !selectedWeekId || s.week_id === selectedWeekId;
      return matchesCohort && matchesWeek;
    });
  }, [selectedCohortId, selectedWeekId, sessions]);

  const availableTeams = React.useMemo(() => {
    if (!selectedCohortId) return [];
    return teams.filter((t) => t.cohort_id === selectedCohortId);
  }, [selectedCohortId, teams]);

  // When session and team are chosen, check if a working board already exists for that pair
  React.useEffect(() => {
    if (!selectedSessionId || !selectedTeamId) {
      if (!editingBoardId) {
        setTitle("Working Board");
        setWorkingBoardUrl("");
        setInstructions("");
      }
      return;
    }

    const existing = workingBoards.find(
      (b) => b.session_id === selectedSessionId && b.team_id === selectedTeamId
    );

    if (existing) {
      setEditingBoardId(existing.id);
      setTitle(existing.title || "Working Board");
      setWorkingBoardUrl(existing.working_board_url || "");
      setInstructions(existing.instructions || "");
      setFormError(null);
    } else if (editingBoardId) {
      // Switched away from an existing one
      setEditingBoardId(null);
      setTitle("Working Board");
      setWorkingBoardUrl("");
      setInstructions("");
    }
  }, [selectedSessionId, selectedTeamId, workingBoards, editingBoardId]);

  // Handle URL Validation
  function validateUrl(url: string): string | null {
    const trimmed = url.trim();
    if (!trimmed) {
      return "Google Drive / Google Docs link is required.";
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "https:") {
        return "Working Board URL must start with https://";
      }
      const host = parsed.hostname.toLowerCase();
      const isAllowed =
        host === "docs.google.com" ||
        host === "drive.google.com" ||
        host.endsWith(".docs.google.com") ||
        host.endsWith(".drive.google.com");
      if (!isAllowed) {
        return "Working Board URL must be a valid Google Docs or Google Drive link (docs.google.com or drive.google.com).";
      }
    } catch {
      return "Please enter a valid URL (e.g., https://docs.google.com/document/d/...).";
    }
    return null;
  }

  // Handle submit (save draft or publish)
  async function handleSave(publish: boolean) {
    setFormError(null);
    setActionSuccess(null);

    if (!selectedCohortId) {
      setFormError("Please select a Batch/Cohort.");
      return;
    }
    if (!selectedSessionId) {
      setFormError("Please select a Session.");
      return;
    }
    if (!selectedTeamId) {
      setFormError("Please select a Team.");
      return;
    }

    const urlError = validateUrl(workingBoardUrl);
    if (urlError) {
      setFormError(urlError);
      return;
    }

    setSaving(true);
    try {
      if (editingBoardId) {
        // Update existing
        await updateAdminWorkingBoard(editingBoardId, {
          title: title.trim() || "Working Board",
          working_board_url: workingBoardUrl.trim(),
          instructions: instructions.trim() || null,
          is_published: publish,
        });
        setActionSuccess(
          `Working Board updated and ${publish ? "published" : "saved as draft"} successfully.`
        );
      } else {
        // Create new
        await createAdminWorkingBoard({
          session_id: selectedSessionId,
          team_id: selectedTeamId,
          title: title.trim() || "Working Board",
          working_board_url: workingBoardUrl.trim(),
          instructions: instructions.trim() || null,
          is_published: publish,
        });
        setActionSuccess(
          `Working Board created and ${publish ? "published" : "saved as draft"} successfully.`
        );
      }
      await loadBoards();
    } catch (err: unknown) {
      console.error("Failed to save working board:", err);
      setFormError(err instanceof Error ? err.message : "Failed to save Working Board.");
    } finally {
      setSaving(false);
    }
  }

  // Quick toggle publication
  async function handleTogglePublication(board: AdminWorkingBoardDetail) {
    try {
      await patchAdminWorkingBoardPublication(board.id, !board.is_published);
      setActionSuccess(
        `Working Board "${board.title}" for ${board.team_name ?? "Team"} is now ${
          !board.is_published ? "published" : "unpublished (draft)"
        }.`
      );
      await loadBoards();
    } catch (err: unknown) {
      console.error("Failed to toggle publication:", err);
      setError(err instanceof Error ? err.message : "Failed to change publication state.");
    }
  }

  // Select board for editing from table
  function handleSelectForEdit(board: AdminWorkingBoardDetail) {
    setEditingBoardId(board.id);
    setSelectedCohortId(board.cohort_id || "");
    setSelectedSessionId(board.session_id);
    setSelectedTeamId(board.team_id);
    setTitle(board.title || "Working Board");
    setWorkingBoardUrl(board.working_board_url);
    setInstructions(board.instructions || "");
    setFormError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleResetForm() {
    setEditingBoardId(null);
    setSelectedCohortId("");
    setSelectedWeekId("");
    setSelectedSessionId("");
    setSelectedTeamId("");
    setTitle("Working Board");
    setWorkingBoardUrl("");
    setInstructions("");
    setFormError(null);
  }

  // Filtered boards for table
  const filteredBoards = React.useMemo(() => {
    return workingBoards.filter((b) => {
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matches =
          (b.title && b.title.toLowerCase().includes(q)) ||
          (b.team_name && b.team_name.toLowerCase().includes(q)) ||
          (b.session_title && b.session_title.toLowerCase().includes(q)) ||
          (b.cohort_name && b.cohort_name.toLowerCase().includes(q)) ||
          b.working_board_url.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [workingBoards, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">
            Working Board Management
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Configure collaborative Google Docs working boards for fellowship teams and sessions.
          </p>
        </div>
        <button
          type="button"
          onClick={loadBoards}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border-default)] bg-white text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[var(--color-brand-blue)]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Global Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Working Board Form Card */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-default)] shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[var(--color-border-default)] bg-gradient-to-r from-blue-50/40 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)]">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  {editingBoardId ? "Edit Existing Working Board" : "Create Working Board"}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Add the Google Drive link and provide clear instructions for the team to work collaboratively on the session&apos;s Working Board.
                </p>
              </div>
            </div>

            {editingBoardId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[var(--color-brand-blue)] border border-blue-200">
                <Edit2 className="h-3 w-3" /> Editing Mode
              </span>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Hierarchy Selection: Batch -> Week -> Session -> Team */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Cohort */}
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                1. Cohort / Batch <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCohortId}
                onChange={(e) => {
                  setSelectedCohortId(e.target.value);
                  setSelectedSessionId("");
                  setSelectedTeamId("");
                }}
                disabled={saving}
                className="w-full text-xs rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              >
                <option value="">Select Cohort / Batch</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Week */}
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                2. Week (Optional Filter)
              </label>
              <select
                value={selectedWeekId}
                onChange={(e) => {
                  setSelectedWeekId(e.target.value);
                  setSelectedSessionId("");
                }}
                disabled={!selectedCohortId || saving}
                className="w-full text-xs rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)] disabled:opacity-50"
              >
                <option value="">All Weeks in Cohort</option>
                {availableWeeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    Week {w.week_number}: {w.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Session */}
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                3. Session <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                disabled={!selectedCohortId || saving}
                className="w-full text-xs rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)] disabled:opacity-50"
              >
                <option value="">Select Session</option>
                {availableSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Session {s.session_number}: {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Team */}
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                4. Team <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={!selectedCohortId || saving}
                className="w-full text-xs rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)] disabled:opacity-50"
              >
                <option value="">Select Team</option>
                {availableTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form details: Title, Google Docs URL, Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                Working Board Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Session 1 Working Board"
                disabled={saving}
                className="w-full text-xs rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                Google Drive / Google Docs Link <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={workingBoardUrl}
                  onChange={(e) => setWorkingBoardUrl(e.target.value)}
                  placeholder="https://docs.google.com/document/d/... or drive.google.com"
                  disabled={saving}
                  className="w-full text-xs rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
                />
                {workingBoardUrl && (
                  <a
                    href={workingBoardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--color-brand-blue)] hover:text-blue-700"
                    title="Test Open Link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
              Instructions for Collaborative Work
            </label>
            <textarea
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Provide clear instructions for fellows on how to collaborate on this working board..."
              disabled={saving}
              className="w-full text-xs leading-relaxed rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-border-default)]">
            <div className="text-[11px] text-[var(--color-text-muted)]">
              {editingBoardId
                ? "Editing board ID: " + editingBoardId
                : "A single Working Board will be published per team per session."}
            </div>

            <div className="flex items-center gap-2">
              {editingBoardId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  disabled={saving}
                  className="px-3.5 py-2 rounded-xl border border-[var(--color-border-default)] text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-gray-50"
                >
                  Cancel Edit
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving || !selectedSessionId || !selectedTeamId || !workingBoardUrl.trim()}
                className="px-4 py-2 rounded-xl border border-[var(--color-border-default)] bg-white text-xs font-bold text-[var(--color-text-primary)] hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving || !selectedSessionId || !selectedTeamId || !workingBoardUrl.trim()}
                className="px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-bold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Globe className="h-3.5 w-3.5" />
                {saving ? "Publishing..." : "Publish Working Board"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Configured Working Boards Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Configured Working Boards ({filteredBoards.length})
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search boards, teams, sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[var(--color-border-default)] bg-white focus:outline-none focus:border-[var(--color-brand-blue)] w-60"
              />
            </div>

            <select
              value={filterCohortId}
              onChange={(e) => setFilterCohortId(e.target.value)}
              className="text-xs rounded-xl border border-[var(--color-border-default)] bg-white px-2.5 py-1.5 text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
            >
              <option value="all">All Cohorts</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)]">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--color-brand-blue)]" />
            Loading working boards...
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[var(--color-border-default)]">
            <FileSpreadsheet className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
            <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
              No Working Boards Found
            </h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Select a Cohort, Session, and Team above to configure a collaborative Working Board.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[var(--color-border-default)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] bg-gray-50/75 text-[var(--color-text-muted)] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Session & Cohort</th>
                    <th className="py-3.5 px-4">Team</th>
                    <th className="py-3.5 px-4">Working Board Link</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Updated</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-default)]">
                  {filteredBoards.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--color-text-primary)]">
                          Session {b.session_number}: {b.session_title}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                          {b.cohort_name}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {b.team_name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <a
                          href={b.working_board_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[var(--color-brand-blue)] hover:underline font-medium truncate max-w-full"
                          title={b.working_board_url}
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{b.title || "Working Board"}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                        </a>
                        {b.instructions && (
                          <div className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">
                            {b.instructions}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {b.is_published ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Globe className="h-3 w-3" /> Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-[var(--color-text-secondary)] border border-gray-200">
                            <Lock className="h-3 w-3" /> Draft
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[var(--color-text-muted)]">
                        {new Date(b.updated_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePublication(b)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              b.is_published
                                ? "border border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:text-red-700 hover:border-red-200 hover:bg-red-50"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {b.is_published ? "Unpublish" : "Publish"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectForEdit(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--color-border-default)] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-gray-100 transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
