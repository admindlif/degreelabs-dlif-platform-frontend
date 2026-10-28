// ─── Mentor Portal API Types ───────────────────────────────────────────────

export interface MentorUserSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
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

export interface MentorContext {
  mentor: MentorUserSummary;
  assigned_teams: MentorTeamSummary[];
}

// ─── Teams ─────────────────────────────────────────────────────────────────

export interface FellowSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  team_role: "lead" | "member" | string;
}

export interface MentorTeamSummary {
  id: string;
  name: string;
  company_name: string | null;
  company_challenge: string | null;
  cohort: CohortSummary;
  current_phase: PhaseSummary | null;
  member_count: number;
  members: FellowSummary[];
}

// ─── Sessions ──────────────────────────────────────────────────────────────

export interface SessionSummary {
  id: string;
  session_number: number;
  session_type: "induction" | "learn_work" | "output_review" | string | null;
  title: string;
  description: string | null;
  start_at: string | null;
  end_at: string | null;
  status: "scheduled" | "live" | "completed" | "cancelled" | "locked" | string;
  sequence: number;
  has_recording: boolean;
  has_transcript: boolean;
  phase_id: string;
  week_id: string | null;
  week_title: string | null;
  week_number: number | null;
}

export interface MentorSessionsResponse {
  team_id: string;
  team_name: string;
  sessions: SessionSummary[];
}

// ─── Checklist Review ──────────────────────────────────────────────────────

export type ChecklistReviewStatus =
  | "not_checked"
  | "pending_review"
  | "accepted"
  | "rejected";

export interface MentorChecklistItem {
  /** Unique row identity for this checklist-item/fellow combination. */
  id: string;
  checklist_item_id: string;
  title: string;
  description: string | null;
  category: string | null;
  due_at: string | null;
  is_required: boolean;
  is_completed: boolean;
  completed_at: string | null;
  sequence: number;

  // Fellow response data
  contribution: string | null;
  reflection: string | null;
  my_thoughts?: string | null;

  // Review workflow
  review_status: ChecklistReviewStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;

  // Scope context
  session_id: string | null;
  session_name: string | null;
  week_number: number | null;
  cohort_name: string | null;

  // Fellow info
  fellow_id: string;
  fellow_name: string;
  team_id: string;
  team_name: string;
}

export interface MentorChecklistReviewPayload {
  action: "accept" | "reject";
  rejection_reason?: string;
}

export interface MentorChecklistDefinition {
  id: string;
  team_id: string | null;
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
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  applicable_team_id: string;
  applicable_team_name: string;
  creator_name: string | null;
  can_edit: boolean;
}

export interface MentorChecklistDefinitionCreate {
  team_id: string;
  phase_id: string;
  week_id: string;
  session_id: string;
  title: string;
  description?: string | null;
  due_at?: string | null;
  action_label?: string | null;
  action_url?: string | null;
  is_required: boolean;
  is_active: boolean;
  sequence?: number;
}

export type MentorChecklistDefinitionUpdate = Partial<
  Omit<MentorChecklistDefinitionCreate, "team_id" | "is_active">
>;

// ─── Checklist Feedback (Discussion Thread) ────────────────────────────────

export interface ChecklistFeedbackMessage {
  id: string;
  checklist_item_id: string;
  fellow_user_id: string;
  author_user_id: string;
  author_role: string;
  author_name: string;
  message: string;
  created_at: string;
}

export interface ChecklistFeedbackThreadResponse {
  checklist_item_id: string;
  fellow_user_id: string;
  messages: ChecklistFeedbackMessage[];
}

// ─── Submission Insights (Document Evaluations) ───────────────────────────

export type SubmissionFeedbackStatus = "revision_required" | "accepted";

export interface TeamSubmissionDetail {
  id: string;
  session_id: string;
  team_id: string;
  submitted_by_user_id: string | null;
  drive_url: string;
  submitted_at: string;
  updated_at: string;
}

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

export interface SessionSubmissionSummary {
  session: SessionSummary;
  submission: TeamSubmissionDetail | null;
  feedback: SubmissionFeedback | null;
}

export interface TeamSubmissionsResponse {
  team_id: string;
  team_name: string;
  submissions: SessionSubmissionSummary[];
}

// ─── Notifications ─────────────────────────────────────────────────────────

export type NotificationType =
  | "checklist_submitted"
  | "checklist_discussion"
  | "submission_updated"
  | string;

export interface MentorNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  target_url: string | null;
  meta: Record<string, string | number | null>;
}

export interface MentorNotificationsResponse {
  total_count: number;
  unread_count: number;
  notifications: MentorNotification[];
}

// ─── Mentor Home ───────────────────────────────────────────────────────────

export interface PendingReviewSummary {
  team_id: string;
  team_name: string;
  pending_count: number;
}

export interface MentorHomeResponse {
  mentor: MentorUserSummary;
  assigned_teams: MentorTeamSummary[];
  pending_reviews: PendingReviewSummary[];
  unread_notifications: number;
}

// ─── Working Board & Mentor Insights ────────────────────────────────

export interface MentorWorkingBoardSummary {
  id: string;
  session_id: string;
  team_id: string;
  team_name: string;
  session_title: string;
  session_number?: number | null;
  week_number?: number | null;
  cohort_name?: string | null;
  title: string;
  working_board_url: string;
  instructions: string | null;
  is_published: boolean;
  updated_at: string;
  has_insights?: boolean;
  insights_status?: "draft" | "published" | null;
}

export interface MentorWorkingBoardInsightsDetail {
  id: string;
  working_board_id: string;
  session_id: string;
  team_id: string;
  mentor_user_id: string;
  mentor_name: string | null;
  insights_text: string;
  publication_status: "draft" | "published";
  tagline: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MentorWorkingBoardDetail extends MentorWorkingBoardSummary {
  insights: MentorWorkingBoardInsightsDetail | null;
  fellows: FellowSummary[];
}

export interface MentorWorkingBoardInsightsUpsertPayload {
  insights_text: string;
  publication_status?: "draft" | "published";
}

export interface MentorSessionDetail {
  id: string;
  cohort_id: string;
  cohort_name: string | null;
  phase_id: string;
  phase_name: string | null;
  week_id: string | null;
  week_number: number | null;
  week_title: string | null;
  team_id: string;
  team_name: string;
  session_number: number;
  session_type: string;
  title: string;
  description: string | null;
  start_at: string | null;
  end_at: string | null;
  unlock_at: string | null;
  submission_enabled: boolean;
  meeting_url: string | null;
  meeting_provider: string | null;
  recording_url: string | null;
  transcript_url: string | null;
  status: string;
  sequence: number;
  is_unlocked: boolean;
  has_recording: boolean;
  has_transcript: boolean;
}


// --- Phase Gate Types ---

export interface PhaseGateDimension {
  id: string;
  dimension_key: string;
  dimension_title: string;
  sequence: number;
  is_cleared: boolean | null;
  mentor_comment: string | null;
}

export interface RubricDimension {
  key?: string;
  dimension_key?: string;
  title?: string;
  dimension_title?: string;
  sequence: number;
  description: string;
}

export interface PhaseGateAssessment {
  id: string;
  team_id: string;
  cohort_id: string;
  mentor_user_id: string | null;
  phase_gate_code: string;
  status: "draft" | "submitted";
  total_cleared: number;
  total_uncleared: number;
  mentor_notes: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  dimensions: PhaseGateDimension[];
  rubric?: RubricDimension[];
}

export interface PhaseGateDimensionUpdate {
  dimension_key: string;
  is_cleared?: boolean | null;
  mentor_comment?: string | null;
}

export interface PhaseGateSavePayload {
  dimensions: PhaseGateDimensionUpdate[];
  mentor_notes?: string | null;
}
