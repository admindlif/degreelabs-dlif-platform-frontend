"use client";

import * as React from "react";
import {
  UserPlus,
  Edit2,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Search,
  FileText,
  UserCheck,
} from "lucide-react";
import {
  AdminMentor,
  AdminMentorAssignment,
  AdminChecklistReviewItem,
  AdminCohort,
  AdminTeam,
  AdminSession,
  getAdminMentors,
  createAdminMentor,
  updateAdminMentor,
  deleteAdminMentor,
  getAdminMentorAssignments,
  createAdminMentorAssignment,
  deleteAdminMentorAssignment,
  getAdminChecklistReviews,
} from "@/lib/api/admin";

interface MentorManagementTabProps {
  cohorts: AdminCohort[];
  teams: AdminTeam[];
  sessions: AdminSession[];
}

export function MentorManagementTab({
  cohorts,
  teams,
  sessions,
}: MentorManagementTabProps) {
  const [mentors, setMentors] = React.useState<AdminMentor[]>([]);
  const [assignments, setAssignments] = React.useState<AdminMentorAssignment[]>([]);
  const [reviews, setReviews] = React.useState<AdminChecklistReviewItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Invite mentor modal
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [editingMentor, setEditingMentor] = React.useState<AdminMentor | null>(null);
  const [editFirstName, setEditFirstName] = React.useState("");
  const [editLastName, setEditLastName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editRole, setEditRole] = React.useState("MENTOR");
  const [editStatus, setEditStatus] = React.useState("active");
  const [updating, setUpdating] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [inviting, setInviting] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);

  // Assignment form
  const [selectedCohortId, setSelectedCohortId] = React.useState("");
  const [selectedTeamId, setSelectedTeamId] = React.useState("");
  const [selectedMentorId, setSelectedMentorId] = React.useState("");
  const [assigning, setAssigning] = React.useState(false);
  const [assignError, setAssignError] = React.useState<string | null>(null);

  // Filter for reviews
  const [reviewCohortFilter, setReviewCohortFilter] = React.useState("all");
  const [reviewStatusFilter, setReviewStatusFilter] = React.useState("all");
  const [searchMentor, setSearchMentor] = React.useState("");

  // Sub-view: "mentors" | "assignments" | "reviews"
  const [activeSubTab, setActiveSubTab] = React.useState<"mentors" | "assignments" | "reviews">("mentors");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mentorsData, assignmentsData, reviewsData] = await Promise.all([
        getAdminMentors().catch(() => []),
        getAdminMentorAssignments().catch(() => []),
        getAdminChecklistReviews().catch(() => []),
      ]);
      setMentors(mentorsData);
      setAssignments(assignmentsData);
      setReviews(reviewsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load mentor data.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const availableTeams = React.useMemo(() => {
    if (!selectedCohortId) return teams;
    return teams.filter((t) => t.cohort_id === selectedCohortId);
  }, [teams, selectedCohortId]);

  async function handleCreateMentor(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setInviteError("All fields are required.");
      return;
    }
    setInviting(true);
    setInviteError(null);
    try {
      await createAdminMentor({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
      });
      setFirstName("");
      setLastName("");
      setEmail("");
      setShowInviteModal(false);
      await loadData();
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Failed to create mentor account.");
    } finally {
      setInviting(false);
    }
  }

  function openEditModal(mentor: AdminMentor) {
    setEditingMentor(mentor);
    setEditFirstName(mentor.first_name);
    setEditLastName(mentor.last_name);
    setEditEmail(mentor.email);
    setEditRole(mentor.role);
    setEditStatus(mentor.account_status);
    setEditError(null);
  }

  async function handleUpdateMentor(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMentor) return;
    if (!editFirstName.trim() || !editLastName.trim() || !editEmail.trim()) {
      setEditError("All fields are required.");
      return;
    }
    setUpdating(true);
    setEditError(null);
    try {
      await updateAdminMentor(editingMentor.id, {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole.toLowerCase(),
        account_status: editStatus.toLowerCase(),
      });
      setEditingMentor(null);
      setActionSuccess("Mentor updated successfully.");
      setTimeout(() => setActionSuccess(null), 3000);
      await loadData();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update mentor.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteMentor(mentor: AdminMentor) {
    if (!window.confirm(`Are you sure you want to remove mentor "${mentor.first_name} ${mentor.last_name}"? All assigned team relationships will also be unassigned.`)) {
      return;
    }
    try {
      await deleteAdminMentor(mentor.id);
      setActionSuccess(`Mentor "${mentor.first_name} ${mentor.last_name}" removed.`);
      setTimeout(() => setActionSuccess(null), 3000);
      await loadData();
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : "Failed to remove mentor.");
    }
  }

  async function handleAssignMentor(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMentorId || !selectedTeamId) {
      setAssignError("Please select both a mentor and a team.");
      return;
    }
    setAssigning(true);
    setAssignError(null);
    try {
      await createAdminMentorAssignment({
        mentor_user_id: selectedMentorId,
        team_id: selectedTeamId,
      });
      setSelectedMentorId("");
      setSelectedTeamId("");
      await loadData();
    } catch (err: unknown) {
      setAssignError(err instanceof Error ? err.message : "Failed to assign mentor to team.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleDeleteAssignment(id: string) {
    if (!window.confirm("Are you sure you want to remove this mentor assignment?")) return;
    try {
      await deleteAdminMentorAssignment(id);
      await loadData();
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : "Failed to remove assignment.");
    }
  }

  const filteredMentors = React.useMemo(() => {
    if (!searchMentor.trim()) return mentors;
    const q = searchMentor.toLowerCase();
    return mentors.filter(
      (m) =>
        m.first_name.toLowerCase().includes(q) ||
        m.last_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [mentors, searchMentor]);

  const filteredReviews = React.useMemo(() => {
    return reviews.filter((r) => {
      if (reviewCohortFilter !== "all" && r.cohort_name !== reviewCohortFilter) return false;
      if (reviewStatusFilter !== "all" && r.review_status !== reviewStatusFilter) return false;
      return true;
    });
  }, [reviews, reviewCohortFilter, reviewStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">
            Mentor Management
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Manage mentor accounts, assign mentors to fellowship teams, and oversee checklist reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border-default)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setInviteError(null);
              setShowInviteModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-brand-blue)] px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add Mentor
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {actionSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          {actionSuccess}
        </div>
      )}

      {/* Sub tabs navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-default)] pb-1">
        <button
          type="button"
          onClick={() => setActiveSubTab("mentors")}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-bold transition-colors ${
            activeSubTab === "mentors"
              ? "border-[var(--color-brand-orange)] text-[var(--color-brand-orange)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <Users className="h-4 w-4" />
          Mentors ({mentors.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("assignments")}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-bold transition-colors ${
            activeSubTab === "assignments"
              ? "border-[var(--color-brand-orange)] text-[var(--color-brand-orange)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Team Assignments ({assignments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("reviews")}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-bold transition-colors ${
            activeSubTab === "reviews"
              ? "border-[var(--color-brand-orange)] text-[var(--color-brand-orange)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <FileText className="h-4 w-4" />
          Checklist Reviews ({reviews.length})
        </button>
      </div>

      {/* SUB-VIEW 1: MENTORS LIST */}
      {activeSubTab === "mentors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search mentors by name or email..."
                value={searchMentor}
                onChange={(e) => setSearchMentor(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-default)] bg-white pl-9 pr-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand-orange)] focus:outline-none"
              />
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">
              Showing {filteredMentors.length} of {mentors.length} mentors
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="border-b bg-[var(--color-bg-canvas)]">
                  <tr>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Mentor</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Email</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Role</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Status</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Assigned Teams</th>
                    <th className="px-4 py-3 font-bold text-right text-[var(--color-text-primary)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-default)]">
                  {filteredMentors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                        No mentors found. Click &quot;Add Mentor&quot; above to create or invite a mentor.
                      </td>
                    </tr>
                  ) : (
                    filteredMentors.map((m) => {
                      const mentorAssignments = assignments.filter((a) => a.mentor_user_id === m.id);
                      return (
                        <tr key={m.id} className="hover:bg-[var(--color-bg-subtle)]/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-[var(--color-text-primary)]">
                            {m.first_name} {m.last_name}
                          </td>
                          <td className="px-4 py-3 text-[var(--color-text-body)]">{m.email}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                              {m.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                                m.account_status === "active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {m.account_status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {mentorAssignments.length === 0 ? (
                              <span className="text-[var(--color-text-muted)] italic">No teams assigned</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {mentorAssignments.map((a) => (
                                  <span
                                    key={a.id}
                                    className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-text-secondary)]"
                                  >
                                    {a.team_name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMentorId(m.id);
                                  setActiveSubTab("assignments");
                                }}
                                title="Assign to Team"
                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-default)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--color-brand-blue)] hover:bg-blue-50 transition-colors"
                              >
                                <ShieldCheck className="h-3 w-3" />
                                Assign
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(m)}
                                title="Edit Mentor"
                                className="inline-flex items-center rounded-lg border border-[var(--color-border-default)] bg-white p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-brand-orange)] transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteMentor(m)}
                                title="Delete Mentor"
                                className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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

      {/* SUB-VIEW 2: MENTOR-TO-TEAM ASSIGNMENTS */}
      {activeSubTab === "assignments" && (
        <div className="space-y-6">
          {/* Assignment Creation Card */}
          <section className="rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              Assign Mentor to Team
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Select a batch/cohort, team, and mentor to authorize them to review the team&apos;s checklist items and document submissions.
            </p>

            {assignError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignMentor} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  1. Select Cohort
                </label>
                <select
                  value={selectedCohortId}
                  onChange={(e) => {
                    setSelectedCohortId(e.target.value);
                    setSelectedTeamId("");
                  }}
                  className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs text-[var(--color-text-primary)]"
                >
                  <option value="">All Cohorts</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  2. Select Team *
                </label>
                <select
                  required
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs text-[var(--color-text-primary)]"
                >
                  <option value="">Choose Team...</option>
                  {availableTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  3. Select Mentor *
                </label>
                <select
                  required
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs text-[var(--color-text-primary)]"
                >
                  <option value="">Choose Mentor...</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={assigning}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-brand-orange)] px-4 py-2 text-xs font-bold text-white hover:bg-[#e05423] disabled:opacity-60 transition-colors h-[38px]"
                >
                  <UserCheck className="h-4 w-4" />
                  {assigning ? "Assigning..." : "Assign Mentor"}
                </button>
              </div>
            </form>
          </section>

          {/* Active Assignments Table */}
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white shadow-sm">
            <div className="p-4 border-b border-[var(--color-border-default)] flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)]">
                Active Mentor Assignments ({assignments.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b bg-[var(--color-bg-canvas)]">
                  <tr>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Team</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Cohort / Batch</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Mentor</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Mentor Email</th>
                    <th className="px-4 py-3 text-right font-bold text-[var(--color-text-primary)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-default)]">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                        No mentor team assignments have been made yet.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-[var(--color-bg-subtle)]/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-[var(--color-text-primary)]">{a.team_name}</td>
                        <td className="px-4 py-3 text-[var(--color-text-body)]">{a.cohort_name}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--color-brand-blue)]">
                          {a.mentor_name}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">{a.mentor_email}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => void handleDeleteAssignment(a.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Unassign
                          </button>
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

      {/* SUB-VIEW 3: FELLOW CHECKLIST STATUSES & MENTOR REVIEWS */}
      {activeSubTab === "reviews" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">Batch:</span>
              <select
                value={reviewCohortFilter}
                onChange={(e) => setReviewCohortFilter(e.target.value)}
                className="rounded-xl border border-[var(--color-border-default)] bg-white px-3 py-1.5 text-xs text-[var(--color-text-primary)]"
              >
                <option value="all">All Batches</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">Review Status:</span>
              <select
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
                className="rounded-xl border border-[var(--color-border-default)] bg-white px-3 py-1.5 text-xs text-[var(--color-text-primary)]"
              >
                <option value="all">All Statuses</option>
                <option value="pending_review">Pending Review</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="not_checked">Not Checked</option>
              </select>
            </div>

            <span className="text-xs text-[var(--color-text-muted)] ml-auto">
              {filteredReviews.length} checklist responses recorded
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="border-b bg-[var(--color-bg-canvas)]">
                  <tr>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Fellow / Team</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Checklist Item</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Session / Batch</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Review Status</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Mentor Reviewer</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text-primary)]">Response Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-default)]">
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                        No fellow checklist activity recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((r) => (
                      <tr key={r.id} className="hover:bg-[var(--color-bg-subtle)]/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-[var(--color-text-primary)]">{r.fellow_name}</div>
                          <div className="text-[11px] text-[var(--color-text-muted)]">
                            {r.team_name ?? "No Team"} ({r.fellow_email})
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-[var(--color-text-primary)]">
                            {r.checklist_item_title}
                          </div>
                          {r.is_completed && (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="h-3 w-3" /> Checked
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-[var(--color-text-muted)]">
                          <div>{r.session_name ?? "Session"}</div>
                          <div className="text-[10px]">{r.cohort_name ?? "Cohort"}</div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                              r.review_status === "accepted"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : r.review_status === "rejected"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : r.review_status === "pending_review"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {r.review_status === "pending_review" ? "Pending Review" : r.review_status}
                          </span>
                          {r.review_status === "rejected" && r.rejection_reason && (
                            <p className="mt-1 text-[10px] text-red-600 line-clamp-1 italic">
                              Reason: {r.rejection_reason}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 text-[var(--color-text-body)]">
                          {r.reviewed_by_name ? (
                            <div>
                              <div className="font-semibold">{r.reviewed_by_name}</div>
                              {r.reviewed_at && (
                                <div className="text-[10px] text-[var(--color-text-muted)]">
                                  {new Date(r.reviewed_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[var(--color-text-muted)] italic">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 max-w-xs text-[var(--color-text-body)]">
                          {r.contribution ? (
                            <div className="line-clamp-2 text-[11px]">
                              <strong className="text-[var(--color-text-primary)]">Contrib: </strong>
                              {r.contribution}
                            </div>
                          ) : (
                            <span className="text-[var(--color-text-muted)] italic">No response submitted</span>
                          )}
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

      {/* CREATE MENTOR MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border-default)] bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Add Mentor Account
            </h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Create an authorized mentor account. Mentors can access the Mentor Portal and review assigned teams.
            </p>

            {inviteError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleCreateMentor} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Jane"
                  className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs focus:border-[var(--color-brand-orange)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Smith"
                  className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs focus:border-[var(--color-brand-orange)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mentor@example.com"
                  className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs focus:border-[var(--color-brand-orange)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-default)]">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-xl border border-[var(--color-border-default)] px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="rounded-xl bg-[var(--color-brand-blue)] px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-60"
                >
                  {inviting ? "Creating..." : "Create Mentor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MENTOR MODAL */}
      {editingMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border-default)] bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Edit Mentor Account
            </h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Update mentor information, platform role, and active status.
            </p>

            {editError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateMentor} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs focus:border-[var(--color-brand-orange)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs focus:border-[var(--color-brand-orange)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs focus:border-[var(--color-brand-orange)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand-orange)] focus:outline-none"
                  >
                    <option value="MENTOR">Mentor</option>
                    <option value="PROGRAM_MANAGER">Program Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand-orange)] focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-default)]">
                <button
                  type="button"
                  onClick={() => setEditingMentor(null)}
                  className="rounded-xl border border-[var(--color-border-default)] px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-xl bg-[var(--color-brand-orange)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
