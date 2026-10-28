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
export type ChecklistReviewStatus = "not_checked" | "pending_review" | "accepted" | "rejected";

export interface ChecklistItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  due_at: string | null;
  status: ChecklistStatus;
  is_required: boolean;
  is_submitted: boolean;
  is_completed: boolean;
  completed_at: string | null;
  action_label: string | null;
  action_url: string | null;
  sequence: number;

  // Review workflow & context
  session_id?: string | null;
  session_name?: string | null;
  week_number?: number | null;
  cohort_name?: string | null;
  contribution?: string | null;
  reflection?: string | null;
  my_thoughts?: string | null;
  review_status?: ChecklistReviewStatus | string;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
}

export interface ChecklistFeedbackMessage {
  id: string;
  checklist_item_id: string;
  fellow_user_id: string;
  author_user_id: string;
  author_role: string;
  message: string;
  created_at: string;
}

export interface ChecklistFeedbackThreadResponse {
  checklist_item_id: string;
  fellow_user_id: string;
  messages: ChecklistFeedbackMessage[];
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

// --- Checklist Reminders (header notification popover) ---

export type ChecklistReminderStatus = "overdue" | "pending";

export interface ChecklistReminderItem {
  id: string;
  title: string;
  message: string;
  status: ChecklistReminderStatus;
  due_at: string | null;
  target_url: string;
}

export interface ChecklistRemindersResponse {
  total_count: number;
  reminders: ChecklistReminderItem[];
}

// --- Phase 3: tl;dv Recording & Transcript Integration ---

export type RecordingStatus =
  | "ready"
  | "processing"
  | "unavailable"
  | "failed"
  | string;

export interface SessionRecordingResponse {
  session_id: string;
  has_recording: boolean;
  status: RecordingStatus;
  playback_url: string | null;
  duration_seconds: number | null;
  expires_at: string | null;
  provider: "tldv" | "legacy" | string | null;
}

export interface TranscriptSegment {
  speaker: string | null;
  text: string;
  start_time: number;
  end_time: number | null;
}

export type TranscriptStatus =
  | "ready"
  | "processing"
  | "unavailable"
  | "failed"
  | string;

export interface SessionTranscriptResponse {
  session_id: string;
  has_transcript: boolean;
  status: TranscriptStatus;
  segments: TranscriptSegment[];
  full_text: string | null;
  provider: "tldv" | "legacy" | string | null;
}

// --- Fellowship Homepage Phase Access ---
// Expected contract from /api/v1/fellow/homepage

export type PhaseAccessStatus =
  | "active"
  | "unlocked"
  | "locked"
  | "coming_soon"
  | string;

export interface FellowshipPhase {
  /** Phase code, e.g. "DISCOVER", "VALIDATE", "GROW" */
  code: string;
  title?: string;
  /** The DLIF development principle, e.g. "THINK", "PROVE", "DELIVER" */
  principle?: string;
  duration?: string;
  /** Whether the fellow is authorised to enter this phase */
  access_status: PhaseAccessStatus;
  can_enter: boolean;
  /** Reason shown when locked */
  lock_reason: string | null;
}

export interface FellowHomepageResponse {
  fellow?: FellowUserSummary;
  cohort?: CohortSummary;
  current_phase?: PhaseSummary;
  phases?: FellowshipPhase[];
}

export type FellowHomepageData = FellowHomepageResponse | FellowshipPhase[];

// --- Working Board & Mentor Insights ---

export interface FellowWorkingBoardResponse {
  id: string;
  session_id: string;
  team_id: string;
  title: string;
  working_board_url: string;
  instructions: string | null;
  is_published: boolean;
  updated_at: string;
  cta_text: string;
}

export interface FellowWorkingBoardInsightsResponse {
  id: string;
  working_board_id: string;
  session_id: string;
  team_id: string;
  mentor_user_id: string;
  mentor_name: string | null;
  insights_text: string;
  publication_status: string;
  tagline: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}


// --- Global Session Overview (Option B) ---

export interface SessionOverviewData {
  phase_code: string;
  session_number: number;
  purpose: string;
  what_to_explore: string;
  working_evidence: string;
  source_document: string;
  source_version: string;
  source_page: number;
}


// --- Phase Gate Types (Fellow read-only) ---

export interface PhaseGateDimension {
  id: string;
  dimension_key: string;
  dimension_title: string;
  sequence: number;
  is_cleared: boolean | null;
  mentor_comment: string | null;
}

export interface PhaseGateAssessment {
  id: string;
  team_id: string;
  phase_gate_code: string;
  status: "draft" | "submitted";
  total_cleared: number;
  total_uncleared: number;
  mentor_notes: string | null;
  submitted_at: string | null;
  dimensions: PhaseGateDimension[];
}

export interface PhaseGateAssessmentResponse {
  /** "not_submitted" when no assessment exists, otherwise the backend assessment status */
  status?: "not_submitted" | "draft" | "submitted";
  message?: string;
  id?: string;
  team_id?: string;
  phase_gate_code?: string;
  total_cleared?: number;
  total_uncleared?: number;
  mentor_notes?: string | null;
  submitted_at?: string | null;
  dimensions?: PhaseGateDimension[];
  /** True when admin has approved VALIDATE progression for this team */
  validate_unlocked?: boolean;
}
