export interface FellowUserSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface ProgramSummary {
  id: string;
  name: string;
  code: string;
}

export interface CohortSummary {
  id: string;
  name: string;
  code: string;
  status: string;
}

export interface PhaseSummary {
  id: string;
  code: string;
  name: string;
  development_role: string;
  sequence: number;
}

export interface FellowContext {
  fellow: FellowUserSummary;
  program: ProgramSummary;
  cohort: CohortSummary;
  current_phase: PhaseSummary;
}

export interface SessionSummary {
  id: string;
  session_number: number;

  session_type:
  | "induction"
  | "learn_work"
  | "output_review"
  | string
  | null;

  title: string;
  description: string | null;

  start_at: string | null;
  end_at: string | null;
  unlock_at: string | null;

  is_unlocked: boolean;
  submission_enabled: boolean;

  meeting_url: string | null;
  recording_url: string | null;
  transcript_url: string | null;

  status:
  | "scheduled"
  | "live"
  | "completed"
  | "cancelled"
  | "locked"
  | string;

  sequence: number;

  has_recording: boolean;
  has_transcript: boolean;
}

export interface DiscoverProgress {
  current_week: number;
  total_weeks: number;
  percentage: number;
  completed_sessions: number;
  total_sessions: number;
}

export interface DiscoverOverview {
  phase: PhaseSummary;
  cohort: CohortSummary;
  progress: DiscoverProgress;
  next_session: SessionSummary | null;
}

export interface DiscoverWeek {
  id: string;
  week_number: number;
  title: string;
  strategic_question: string | null;
  description: string | null;
  sequence: number;
  status: "active" | "upcoming" | "locked" | "completed" | string;
  status_badge: string;
  sessions: SessionSummary[];
}

export interface SessionDetail extends SessionSummary {
  cohort_id: string;
  phase_id: string;
  week_id: string | null;
  week_title: string | null;
  week_number: number | null;
}

// --- Milestone 2: Team & Resources ---

export interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
  team_role: "lead" | "member" | string;
}

export interface FellowTeam {
  id: string;
  name: string;
  company_challenge: string | null;
  company_name: string | null;
  member_count: number;
  members: TeamMember[];
}

export interface TeamChallengeResource {
  id: string;
  title: string;
  resource_type: string;
  url: string | null;
  is_downloadable: boolean;
  sequence: number;
}

export interface CompanyChallenge {
  team_id: string;
  team_name: string;

  company_name: string | null;
  company_overview: string | null;

  company_challenge: string | null;
  challenge_description: string | null;

  resources: TeamChallengeResource[];
}
export interface PhaseResource {
  id: string;
  title: string;
  subtitle: string | null;
  resource_type: "handbook" | "rubric" | "template" | "guide" | "link" | string;
  url: string | null;
  is_downloadable: boolean;
  sequence: number;
}

export interface TeamSubmissionDetail {
  id: string;
  session_id: string;
  team_id: string;
  submitted_by_user_id: string | null;

  drive_url: string;

  submitted_at: string;
  updated_at: string;
}

export interface SessionSubmissionResponse {
  submission: TeamSubmissionDetail | null;

  can_submit: boolean;
  is_team_lead: boolean;
}

export type SubmissionFeedbackStatus =
  | "revision_required"
  | "accepted";

export interface SubmissionFeedback {
  id: string;
  submission_id: string;

  reviewed_by_user_id: string | null;

  feedback_text: string;
  feedback_url: string | null;

  status: SubmissionFeedbackStatus;

  created_at: string;
  updated_at: string;
}

export type ChecklistStatus = "pending" | "overdue" | "completed";

export interface ChecklistItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  due_at: string | null;
  status: ChecklistStatus;
  is_required: boolean;
  is_completed: boolean;
  completed_at: string | null;
  action_label: string | null;
  action_url: string | null;
  sequence: number;
}

export interface ChecklistSummary {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  percentage: number;
}

export interface FellowChecklistResponse {
  summary: ChecklistSummary;
  items: ChecklistItem[];
}
