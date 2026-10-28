import { adminApiClient, ApiError } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminStats {
  total_fellows: number;
  active_fellows: number;
  invited_fellows: number;
  total_cohorts: number;
  total_teams: number;
  total_sessions: number;
  current_phase: string;
  week: string;
}

export interface AdminFellow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  account_status: string;
  two_factor_enabled: boolean;
  created_at: string | null;
  last_login_at: string | null;
}

export interface FellowInvitationResult extends AdminFellow {
  invitation_sent: boolean;
  message: string;
}

export interface FellowUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  account_status?: string;
  role?: string;
  two_factor_enabled?: boolean;
}

export interface AdminProgram {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface ProgramCreate {
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
}

export interface AdminCohort {
  id: string;
  program_id: string;
  name: string;
  code: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  participant_count: number;
}

export interface AdminCohortFellow {
  enrollment_id: string;
  fellow_id: string;
  first_name: string;
  last_name: string;
  email: string;
  account_status: string;
  enrollment_status: string;
}

export interface CohortCreate {
  program_id: string;
  name: string;
  code: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export interface AdminPhase {
  id: string;
  program_id: string;
  code: string;
  name: string;
  development_role: string;
  sequence: number;
  description: string | null;
  duration_weeks: number;
  is_active: boolean;
}

export interface PhaseCreate {
  program_id: string;
  code: string;
  name: string;
  development_role: string;
  sequence: number;
  description?: string;
  duration_weeks?: number;
  is_active?: boolean;
}

export interface AdminWeek {
  id: string;
  phase_id: string;
  week_number: number;
  title: string;
  strategic_question: string | null;
  description: string | null;
  sequence: number;
  unlock_at: string | null;
}

export interface WeekCreate {
  phase_id: string;
  week_number: number;
  title: string;
  strategic_question?: string;
  description?: string;
  sequence: number;
  unlock_at?: string;
}

export interface AdminSession {
  id: string;
  cohort_id: string;
  phase_id: string;
  week_id: string | null;

  session_number: number;
  session_type: string;

  title: string;
  description: string | null;

  start_at: string | null;
  end_at: string | null;

  is_unlocked: boolean;
  unlock_at: string | null;

  submission_enabled: boolean;

  meeting_url: string | null;
  recording_url: string | null;
  transcript_url: string | null;

  status: string;
  sequence: number;
}

export interface SessionCreate {
  cohort_id: string;
  phase_id: string;
  week_id?: string | null;

  session_number: number;
  session_type?: string;

  title: string;
  description?: string;

  start_at: string;
  end_at: string;

  recording_url?: string;
  transcript_url?: string;

  submission_enabled?: boolean;

  status?: string;
  sequence: number;

}

export interface AdminTeam {
  id: string;
  cohort_id: string;
  name: string;

  company_name: string | null;
  company_overview: string | null;

  company_challenge: string | null;
  challenge_description: string | null;

  is_active: boolean;
  member_count: number;
}

export interface TeamCreate {
  cohort_id: string;
  name: string;

  company_name?: string | null;
  company_overview?: string | null;

  company_challenge?: string | null;
  challenge_description?: string | null;

  is_active?: boolean;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_role: string;
  joined_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface TeamDetail extends AdminTeam {
  members: TeamMember[];
}

export interface TeamChallengeUpdate {
  company_name?: string | null;
  company_overview?: string | null;
  company_challenge?: string | null;
  challenge_description?: string | null;
}

export interface TeamChallengeResource {
  id: string;
  team_id: string;
  title: string;
  resource_type: string;
  url: string | null;
  is_downloadable: boolean;
  sequence: number;
  created_at: string;
  updated_at: string;
}

export interface TeamChallengeResourceCreate {
  title: string;
  resource_type?: "link";
  url: string;
  is_downloadable?: boolean;
  sequence?: number;
}

export type PhaseProgressionCode = "VALIDATE" | "GROW" | string;
export type PhaseProgressionStatus = "unlocked" | "locked";
export type PhaseProgressionDecision =
  | "company_shortlisted"
  | "paid_implementation_approved"
  | "rejected"
  | null;

export interface TeamPhaseProgression {
  id: string;
  team_id: string;
  cohort_id: string;
  phase_code: PhaseProgressionCode;
  status: PhaseProgressionStatus;
  decision: PhaseProgressionDecision;
  decided_at: string | null;
  decided_by_user_id: string | null;
  notes: string | null;
}

export interface TeamPhaseProgressionUpdate {
  phase_code: "VALIDATE" | "GROW";
  status: "unlocked" | "locked";
  decision: "company_shortlisted" | "paid_implementation_approved" | "rejected";
  notes?: string;
}

export interface AdminResource {
  id: string;
  phase_id: string;
  session_id: string | null;
  title: string;
  subtitle: string | null;
  resource_type: string;
  url: string | null;
  is_downloadable: boolean;
  is_active: boolean;
  sequence: number;
}

export interface ResourceCreate {
  phase_id: string;
  session_id?: string | null;
  title: string;
  subtitle?: string;
  resource_type?: string;
  url?: string;
  is_downloadable?: boolean;
  is_active?: boolean;
  sequence?: number;
}

export interface AdminChecklistItem {
  id: string;
  cohort_id: string | null;
  phase_id: string | null;
  week_id: string | null;
  session_id: string | null;
  required_submission_session_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  due_at: string | null;
  action_label: string | null;
  action_url: string | null;
  is_required: boolean;
  is_active: boolean;
  sequence: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItemWrite {
  cohort_id?: string | null;
  phase_id?: string | null;
  week_id?: string | null;
  session_id?: string | null;
  required_submission_session_id?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  due_at?: string | null;
  action_label?: string | null;
  action_url?: string | null;
  is_required?: boolean;
  is_active?: boolean;
  sequence?: number;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getAdminStats(): Promise<AdminStats> {
  return adminApiClient<AdminStats>("/api/v1/admin/stats");
}

// ---------------------------------------------------------------------------
// Fellows
// ---------------------------------------------------------------------------

export async function getAdminFellows(): Promise<AdminFellow[]> {
  return adminApiClient<AdminFellow[]>("/api/v1/admin/fellows");
}

export async function getAdminFellow(id: string): Promise<AdminFellow> {
  return adminApiClient<AdminFellow>(`/api/v1/admin/fellows/${id}`);
}

export async function inviteFellow(data: { first_name: string; last_name: string; email: string }): Promise<FellowInvitationResult> {
  return adminApiClient<FellowInvitationResult>("/api/v1/admin/fellows", { method: "POST", body: JSON.stringify(data) });
}

export async function resendFellowInvitation(id: string): Promise<{ invitation_sent: boolean; message: string }> {
  return adminApiClient(`/api/v1/admin/fellows/${id}/resend-invitation`, { method: "POST" });
}

export async function updateFellow(id: string, data: FellowUpdate): Promise<AdminFellow> {
  return adminApiClient<AdminFellow>(`/api/v1/admin/fellows/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteFellow(id: string): Promise<void> {
  await adminApiClient(`/api/v1/admin/fellows/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

export async function getAdminPrograms(): Promise<AdminProgram[]> {
  return adminApiClient<AdminProgram[]>("/api/v1/admin/programs");
}

export async function getAdminProgram(id: string): Promise<AdminProgram> {
  return adminApiClient<AdminProgram>(`/api/v1/admin/programs/${id}`);
}

export async function createProgram(data: ProgramCreate): Promise<AdminProgram> {
  return adminApiClient<AdminProgram>("/api/v1/admin/programs", { method: "POST", body: JSON.stringify(data) });
}

export async function updateProgram(id: string, data: Partial<ProgramCreate>): Promise<AdminProgram> {
  return adminApiClient<AdminProgram>(`/api/v1/admin/programs/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteProgram(id: string): Promise<void> {
  await adminApiClient(`/api/v1/admin/programs/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

export async function getAdminPhases(programId?: string): Promise<AdminPhase[]> {
  const qs = programId ? `?program_id=${programId}` : "";
  return adminApiClient<AdminPhase[]>(`/api/v1/admin/phases${qs}`);
}

export async function getAdminPhase(id: string): Promise<AdminPhase> {
  return adminApiClient<AdminPhase>(`/api/v1/admin/phases/${id}`);
}

export async function updatePhase(id: string, data: Partial<AdminPhase>): Promise<AdminPhase> {
  return adminApiClient<AdminPhase>(`/api/v1/admin/phases/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deletePhase(id: string): Promise<void> {
  await adminApiClient(`/api/v1/admin/phases/${id}`, { method: "DELETE" });
}

export async function createPhase(data: PhaseCreate): Promise<AdminPhase> {
  return adminApiClient<AdminPhase>("/api/v1/admin/phases", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Cohorts
// ---------------------------------------------------------------------------

export async function getAdminCohorts(): Promise<AdminCohort[]> {
  return adminApiClient<AdminCohort[]>("/api/v1/admin/cohorts");
}

export async function getAdminCohort(id: string): Promise<AdminCohort> {
  return adminApiClient<AdminCohort>(`/api/v1/admin/cohorts/${id}`);
}

export async function createCohort(data: CohortCreate): Promise<AdminCohort> {
  return adminApiClient<AdminCohort>("/api/v1/admin/cohorts", { method: "POST", body: JSON.stringify(data) });
}

export async function updateCohort(id: string, data: Partial<CohortCreate>): Promise<AdminCohort> {
  return adminApiClient<AdminCohort>(`/api/v1/admin/cohorts/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteCohort(id: string): Promise<void> {
  await adminApiClient(`/api/v1/admin/cohorts/${id}`, { method: "DELETE" });
}

export async function getCohortFellows(
  cohortId: string
): Promise<AdminCohortFellow[]> {
  return adminApiClient<AdminCohortFellow[]>(
    `/api/v1/admin/cohorts/${cohortId}/fellows`
  );
}

export async function addFellowToCohort(
  cohortId: string,
  fellowId: string
): Promise<AdminCohortFellow> {
  return adminApiClient<AdminCohortFellow>(
    `/api/v1/admin/cohorts/${cohortId}/fellows/${fellowId}`,
    {
      method: "POST",
    }
  );
}

export async function removeFellowFromCohort(
  cohortId: string,
  fellowId: string
): Promise<void> {
  await adminApiClient(
    `/api/v1/admin/cohorts/${cohortId}/fellows/${fellowId}`,
    {
      method: "DELETE",
    }
  );
}

// ---------------------------------------------------------------------------
// Weeks
// ---------------------------------------------------------------------------

export async function getAdminWeeks(phaseId?: string): Promise<AdminWeek[]> {
  const qs = phaseId ? `?phase_id=${phaseId}` : "";
  return adminApiClient<AdminWeek[]>(`/api/v1/admin/weeks${qs}`);
}

export async function getAdminWeek(id: string): Promise<AdminWeek> {
  return adminApiClient<AdminWeek>(`/api/v1/admin/weeks/${id}`);
}

export async function createWeek(data: WeekCreate): Promise<AdminWeek> {
  return adminApiClient<AdminWeek>("/api/v1/admin/weeks", { method: "POST", body: JSON.stringify(data) });
}

export async function updateWeek(id: string, data: Partial<WeekCreate>): Promise<AdminWeek> {
  return adminApiClient<AdminWeek>(`/api/v1/admin/weeks/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteWeek(id: string): Promise<void> {
  await adminApiClient(`/api/v1/admin/weeks/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function getAdminSessions(cohortId?: string, weekId?: string): Promise<AdminSession[]> {
  const params = new URLSearchParams();
  if (cohortId) params.set("cohort_id", cohortId);
  if (weekId) params.set("week_id", weekId);
  const qs = params.toString() ? `?${params}` : "";
  return adminApiClient<AdminSession[]>(`/api/v1/admin/sessions${qs}`);
}
export async function getAdminSessionSubmissions(
  sessionId: string
): Promise<AdminSessionSubmissionItem[]> {
  return adminApiClient<AdminSessionSubmissionItem[]>(
    `/api/v1/admin/sessions/${sessionId}/submissions`
  );
}

export async function getAdminSubmissionFeedback(
  submissionId: string
): Promise<AdminSubmissionFeedback | null> {
  return adminApiClient<AdminSubmissionFeedback | null>(
    `/api/v1/admin/submissions/${submissionId}/feedback`
  );
}

export async function saveAdminSubmissionFeedback(
  submissionId: string,
  data: AdminSubmissionFeedbackUpsert
): Promise<AdminSubmissionFeedback> {
  return adminApiClient<AdminSubmissionFeedback>(
    `/api/v1/admin/submissions/${submissionId}/feedback`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export async function getAdminSession(id: string): Promise<AdminSession> {
  return adminApiClient<AdminSession>(`/api/v1/admin/sessions/${id}`);
}

export async function createSession(data: SessionCreate): Promise<AdminSession> {
  return adminApiClient<AdminSession>("/api/v1/admin/sessions", { method: "POST", body: JSON.stringify(data) });
}

export async function updateSession(id: string, data: Partial<SessionCreate>): Promise<AdminSession> {
  return adminApiClient<AdminSession>(`/api/v1/admin/sessions/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteSession(id: string): Promise<void> {
  await adminApiClient(`/api/v1/admin/sessions/${id}`, { method: "DELETE" });
}

export async function unlockSession(id: string): Promise<void> {
  await adminApiClient(
    `/api/v1/admin/sessions/${id}/unlock`,
    {
      method: "PUT",
    }
  );
}

export async function lockSession(id: string): Promise<void> {
  await adminApiClient(
    `/api/v1/admin/sessions/${id}/lock`,
    {
      method: "PUT",
    }
  );
}
// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export async function getAdminTeams(cohortId?: string): Promise<AdminTeam[]> {
  const qs = cohortId ? `?cohort_id=${cohortId}` : "";
  return adminApiClient<AdminTeam[]>(`/api/v1/admin/teams${qs}`);
}

export async function getAdminTeam(id: string): Promise<TeamDetail> {
  return adminApiClient<TeamDetail>(`/api/v1/admin/teams/${id}`);
}

export async function createTeam(data: TeamCreate): Promise<AdminTeam> {
  return adminApiClient<AdminTeam>("/api/v1/admin/teams", { method: "POST", body: JSON.stringify(data) });
}

export async function updateTeam(id: string, data: Partial<TeamCreate>): Promise<AdminTeam> {
  return adminApiClient<AdminTeam>(`/api/v1/admin/teams/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function updateTeamChallenge(
  teamId: string,
  data: TeamChallengeUpdate
): Promise<AdminTeam> {
  return adminApiClient<AdminTeam>(
    `/api/v1/admin/teams/${teamId}/challenge`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export async function getTeamChallengeResources(
  teamId: string
): Promise<TeamChallengeResource[]> {
  return adminApiClient<TeamChallengeResource[]>(
    `/api/v1/admin/teams/${teamId}/challenge/resources`
  );
}

export async function createTeamChallengeResource(
  teamId: string,
  data: TeamChallengeResourceCreate
): Promise<TeamChallengeResource> {
  return adminApiClient<TeamChallengeResource>(
    `/api/v1/admin/teams/${teamId}/challenge/resources`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function updateTeamChallengeResource(
  teamId: string,
  resourceId: string,
  data: Partial<TeamChallengeResourceCreate>
): Promise<TeamChallengeResource> {
  return adminApiClient<TeamChallengeResource>(
    `/api/v1/admin/teams/${teamId}/challenge/resources/${resourceId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export async function deleteTeamChallengeResource(
  teamId: string,
  resourceId: string
): Promise<void> {
  await adminApiClient(
    `/api/v1/admin/teams/${teamId}/challenge/resources/${resourceId}`,
    {
      method: "DELETE",
    }
  );
}

export async function deleteTeam(id: string): Promise<void> {
  await adminApiClient(`/api/v1/admin/teams/${id}`, { method: "DELETE" });
}

export async function addTeamMember(teamId: string, data: { user_id: string; team_role?: string }): Promise<TeamMember> {
  return adminApiClient<TeamMember>(`/api/v1/admin/teams/${teamId}/members`, { method: "POST", body: JSON.stringify(data) });
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  await adminApiClient(`/api/v1/admin/teams/${teamId}/members/${userId}`, { method: "DELETE" });
}

export async function assignTeamLead(
  teamId: string,
  userId: string
): Promise<TeamMember> {
  return adminApiClient<TeamMember>(
    `/api/v1/admin/teams/${teamId}/lead`,
    {
      method: "PUT",
      body: JSON.stringify({
        user_id: userId,
      }),
    }
  );
}

export async function getTeamPhaseProgression(
  teamId: string
): Promise<TeamPhaseProgression[]> {
  return adminApiClient<TeamPhaseProgression[]>(
    `/api/v1/admin/teams/${teamId}/phase-progression`
  );
}

export async function updateTeamPhaseProgression(
  teamId: string,
  data: TeamPhaseProgressionUpdate
): Promise<TeamPhaseProgression> {
  return adminApiClient<TeamPhaseProgression>(
    `/api/v1/admin/teams/${teamId}/phase-progression`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}
// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export async function getAdminResources(
  phaseId?: string,
  sessionId?: string
): Promise<AdminResource[]> {
  const params = new URLSearchParams();

  if (phaseId) {
    params.set(
      "phase_id",
      phaseId
    );
  }

  if (sessionId) {
    params.set(
      "session_id",
      sessionId
    );
  }

  const qs = params.toString()
    ? `?${params.toString()}`
    : "";

  return adminApiClient<AdminResource[]>(
    `/api/v1/admin/resources${qs}`
  );
}

export async function getAdminResource(id: string): Promise<AdminResource> {
  return adminApiClient<AdminResource>(`/api/v1/admin/resources/${id}`);
}

export async function createResource(data: ResourceCreate): Promise<AdminResource> {
  return adminApiClient<AdminResource>("/api/v1/admin/resources", { method: "POST", body: JSON.stringify(data) });
}

export async function updateResource(id: string, data: Partial<ResourceCreate>): Promise<AdminResource> {
  return adminApiClient<AdminResource>(`/api/v1/admin/resources/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteResource(id: string): Promise<void> {
  await adminApiClient(`/api/v1/admin/resources/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Checklist items
// ---------------------------------------------------------------------------

export async function getAdminChecklistItems(): Promise<AdminChecklistItem[]> {
  return adminApiClient<AdminChecklistItem[]>("/api/v1/admin/checklist-items");
}

export async function createChecklistItem(
  data: ChecklistItemWrite
): Promise<AdminChecklistItem> {
  return adminApiClient<AdminChecklistItem>("/api/v1/admin/checklist-items", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateChecklistItem(
  id: string,
  data: Partial<ChecklistItemWrite>
): Promise<AdminChecklistItem> {
  return adminApiClient<AdminChecklistItem>(`/api/v1/admin/checklist-items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteChecklistItem(id: string): Promise<void> {
  await adminApiClient(`/api/v1/admin/checklist-items/${id}`, {
    method: "DELETE",
  });
}

export interface AdminTeamSubmissionDetail {
  id: string;
  session_id: string;
  team_id: string;
  submitted_by_user_id: string | null;

  drive_url: string;

  submitted_at: string;
  updated_at: string;
}

export interface AdminSessionSubmissionItem {
  team_id: string;
  team_name: string;

  team_lead_user_id: string | null;
  team_lead_name: string | null;

  submission: AdminTeamSubmissionDetail | null;
}

export type AdminFeedbackStatus =
  | "revision_required"
  | "accepted";

export interface AdminSubmissionFeedback {
  id: string;
  submission_id: string;
  reviewed_by_user_id: string | null;

  feedback_text: string;
  feedback_url: string | null;

  status: AdminFeedbackStatus;

  created_at: string;
  updated_at: string;
}

export interface AdminSubmissionFeedbackUpsert {
  feedback_text: string;
  feedback_url?: string | null;
  status: AdminFeedbackStatus;
}

// ---------------------------------------------------------------------------
// Mentors & Mentor Assignments
// ---------------------------------------------------------------------------

export interface AdminMentor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  account_status: string;
}

export interface MentorCreate {
  first_name: string;
  last_name: string;
  email: string;
}

export interface AdminMentorAssignment {
  id: string;
  mentor_user_id: string;
  mentor_name: string;
  mentor_email: string;
  team_id: string;
  team_name: string;
  cohort_id: string;
  cohort_name: string;
  created_at: string | null;
}

export interface MentorAssignmentCreate {
  mentor_user_id: string;
  team_id: string;
}

export interface AdminChecklistReviewItem {
  id: string;
  fellow_user_id: string;
  fellow_name: string;
  fellow_email: string;
  team_id: string | null;
  team_name: string | null;
  cohort_name: string | null;
  session_name: string | null;
  checklist_item_id: string;
  checklist_item_title: string;
  is_completed: boolean;
  completed_at: string | null;
  review_status: "not_checked" | "pending_review" | "accepted" | "rejected";
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  contribution: string | null;
  reflection: string | null;
  rejection_reason: string | null;
}

export async function getAdminMentors(): Promise<AdminMentor[]> {
  return adminApiClient<AdminMentor[]>("/admin/mentors");
}

export async function createAdminMentor(data: MentorCreate): Promise<AdminMentor> {
  return adminApiClient<AdminMentor>("/admin/mentors", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface MentorUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  account_status?: string;
}

export async function getAdminMentor(mentorId: string): Promise<AdminMentor & { assigned_teams: any[] }> {
  return adminApiClient(`/admin/mentors/${mentorId}`);
}

export async function updateAdminMentor(
  mentorId: string,
  data: MentorUpdate
): Promise<AdminMentor> {
  return adminApiClient<AdminMentor>(`/admin/mentors/${mentorId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminMentor(mentorId: string): Promise<void> {
  await adminApiClient(`/admin/mentors/${mentorId}`, {
    method: "DELETE",
  });
}

export async function getAdminMentorAssignments(
  cohortId?: string,
  teamId?: string
): Promise<AdminMentorAssignment[]> {
  const params = new URLSearchParams();
  if (cohortId) params.set("cohort_id", cohortId);
  if (teamId) params.set("team_id", teamId);
  const qs = params.toString() ? `?${params}` : "";
  return adminApiClient<AdminMentorAssignment[]>(`/admin/mentor-assignments${qs}`);
}

export async function createAdminMentorAssignment(
  data: MentorAssignmentCreate
): Promise<AdminMentorAssignment> {
  return adminApiClient<AdminMentorAssignment>("/admin/mentor-assignments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminMentorAssignment(assignmentId: string): Promise<void> {
  await adminApiClient(`/admin/mentor-assignments/${assignmentId}`, {
    method: "DELETE",
  });
}

export async function getAdminChecklistReviews(
  cohortId?: string,
  sessionId?: string
): Promise<AdminChecklistReviewItem[]> {
  const params = new URLSearchParams();
  if (cohortId) params.set("cohort_id", cohortId);
  if (sessionId) params.set("session_id", sessionId);
  const qs = params.toString() ? `?${params}` : "";
  return adminApiClient<AdminChecklistReviewItem[]>(`/admin/checklist-reviews${qs}`);
}

// ---------------------------------------------------------------------------
// Working Board Management
// ---------------------------------------------------------------------------

export interface AdminWorkingBoardDetail {
  id: string;
  session_id: string;
  team_id: string;
  title: string;
  working_board_url: string;
  instructions: string | null;
  is_published: boolean;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  session_title: string | null;
  session_number: number | null;
  team_name: string | null;
  cohort_id: string | null;
  cohort_name: string | null;
  week_number: number | null;
}

export interface AdminWorkingBoardCreateRequest {
  session_id: string;
  team_id: string;
  title?: string;
  working_board_url: string;
  instructions?: string | null;
  is_published?: boolean;
}

export interface AdminWorkingBoardUpdateRequest {
  title?: string | null;
  working_board_url?: string | null;
  instructions?: string | null;
  is_published?: boolean | null;
}

export async function getAdminWorkingBoards(
  sessionId?: string,
  teamId?: string,
  cohortId?: string
): Promise<AdminWorkingBoardDetail[]> {
  const params = new URLSearchParams();
  if (sessionId) params.set("session_id", sessionId);
  if (teamId) params.set("team_id", teamId);
  if (cohortId) params.set("cohort_id", cohortId);
  const qs = params.toString() ? `?${params}` : "";
  return adminApiClient<AdminWorkingBoardDetail[]>(`/admin/working-boards${qs}`);
}

export async function getAdminWorkingBoard(boardId: string): Promise<AdminWorkingBoardDetail> {
  return adminApiClient<AdminWorkingBoardDetail>(`/admin/working-boards/${boardId}`);
}

export async function createAdminWorkingBoard(
  data: AdminWorkingBoardCreateRequest
): Promise<AdminWorkingBoardDetail> {
  return adminApiClient<AdminWorkingBoardDetail>("/admin/working-boards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAdminWorkingBoard(
  boardId: string,
  data: AdminWorkingBoardUpdateRequest
): Promise<AdminWorkingBoardDetail> {
  return adminApiClient<AdminWorkingBoardDetail>(`/admin/working-boards/${boardId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function patchAdminWorkingBoardPublication(
  boardId: string,
  isPublished: boolean
): Promise<AdminWorkingBoardDetail> {
  return adminApiClient<AdminWorkingBoardDetail>(`/admin/working-boards/${boardId}/publication`, {
    method: "PATCH",
    body: JSON.stringify({ is_published: isPublished }),
  });
}



// ---------------------------------------------------------------------------
// DISCOVER Phase Gate Reviews
// ---------------------------------------------------------------------------

export interface AdminDiscoverGateDimension {
  id?: string;
  dimension_key: string;
  dimension_title: string;
  sequence: number;
  is_cleared: boolean | null;
  mentor_comment: string | null;
}

export interface AdminDiscoverGateItem {
  id?: string;
  team_id: string;
  team_name: string;
  cohort_id: string;
  cohort_name?: string;
  mentor_user_id?: string | null;
  mentor_name?: string | null;
  company_name?: string | null;
  company_challenge?: string | null;
  assessment_status: "not_submitted" | "draft" | "submitted" | "revision_requested";
  total_cleared: number;
  total_uncleared: number;
  company_shortlisted: "pending" | "shortlisted" | "rejected" | boolean | null;
  phase_progression_status: "locked" | "unlocked";
  submitted_at: string | null;
  mentor_notes?: string | null;
  dimensions?: AdminDiscoverGateDimension[];
}

export async function getAdminDiscoverGates(
  cohortId?: string
): Promise<AdminDiscoverGateItem[]> {
  const qs = cohortId && cohortId !== "all" ? "?cohort_id=" + encodeURIComponent(cohortId) : "";
  try {
    return await adminApiClient<AdminDiscoverGateItem[]>("/admin/phase-gates/discover-to-validate" + qs);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return [];
    }
    throw err;
  }
}

export async function getAdminDiscoverGateDetail(
  teamId: string
): Promise<AdminDiscoverGateItem | null> {
  try {
    return await adminApiClient<AdminDiscoverGateItem>(
      `/admin/phase-gates/discover-to-validate/${encodeURIComponent(teamId)}`
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function recordAdminCompanyDecision(
  teamId: string,
  decision: "shortlisted" | "rejected" | "company_shortlisted",
  notes?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    return await adminApiClient(
      `/admin/phase-gates/discover-to-validate/${encodeURIComponent(teamId)}/company-decision`,
      {
        method: "POST",
        body: JSON.stringify({ decision, notes }),
      }
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const progDecision = decision === "rejected" ? "rejected" : "company_shortlisted";
      await updateTeamPhaseProgression(teamId, {
        phase_code: "VALIDATE",
        status: "locked",
        decision: progDecision,
        notes,
      });
      return { success: true };
    }
    throw err;
  }
}

export async function requestAdminGateRevision(
  teamId: string,
  reason: string
): Promise<{ success: boolean; message?: string }> {
  return await adminApiClient(
    `/admin/phase-gates/discover-to-validate/${encodeURIComponent(teamId)}/request-revision`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    }
  );
}

export async function unlockAdminValidate(
  teamId: string,
  notes?: string
): Promise<TeamPhaseProgression> {
  try {
    return await adminApiClient<TeamPhaseProgression>(
      `/admin/phase-gates/discover-to-validate/${encodeURIComponent(teamId)}/unlock-validate`,
      {
        method: "POST",
        body: JSON.stringify({ notes }),
      }
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return await updateTeamPhaseProgression(teamId, {
        phase_code: "VALIDATE",
        status: "unlocked",
        decision: "company_shortlisted",
        notes,
      });
    }
    throw err;
  }
}
