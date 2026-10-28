import { apiClient } from "@/lib/api/client";
import type {
  MentorContext,
  MentorHomeResponse,
  MentorTeamSummary,
  MentorSessionsResponse,
  MentorSessionDetail,
  MentorChecklistItem,
  MentorChecklistReviewPayload,
  MentorChecklistDefinition,
  MentorChecklistDefinitionCreate,
  MentorChecklistDefinitionUpdate,
  ChecklistFeedbackThreadResponse,
  ChecklistFeedbackMessage,
  TeamSubmissionsResponse,
  MentorNotificationsResponse,
  MentorWorkingBoardSummary,
  MentorWorkingBoardDetail,
  MentorWorkingBoardInsightsDetail,
  MentorWorkingBoardInsightsUpsertPayload,
  PhaseGateAssessment,
  PhaseGateSavePayload,
} from "@/lib/api/types";

// ─── Home ───────────────────────────────────────────────────────────────────

export async function getMentorHome(): Promise<MentorHomeResponse> {
  return apiClient<MentorHomeResponse>("/mentor/home");
}

export async function getMentorContext(): Promise<MentorContext> {
  return apiClient<MentorContext>("/mentor/context");
}

// ─── Teams ──────────────────────────────────────────────────────────────────

export async function getMentorTeams(): Promise<MentorTeamSummary[]> {
  return apiClient<MentorTeamSummary[]>("/mentor/teams");
}

export async function getMentorTeam(teamId: string): Promise<MentorTeamSummary> {
  return apiClient<MentorTeamSummary>(`/mentor/teams/${teamId}`);
}

// ─── Sessions ───────────────────────────────────────────────────────────────

export async function getTeamSessions(teamId: string): Promise<MentorSessionsResponse> {
  return apiClient<MentorSessionsResponse>(`/mentor/teams/${teamId}/sessions`);
}

// ─── Checklist Review ───────────────────────────────────────────────────────

export async function getTeamChecklist(teamId: string): Promise<MentorChecklistItem[]> {
  return apiClient<MentorChecklistItem[]>(`/mentor/teams/${teamId}/checklist`);
}

export async function getMentorChecklistDefinitions(
  teamId: string
): Promise<MentorChecklistDefinition[]> {
  return apiClient<MentorChecklistDefinition[]>(
    `/mentor/checklist-items?team_id=${encodeURIComponent(teamId)}`
  );
}

export async function createMentorChecklistDefinition(
  payload: MentorChecklistDefinitionCreate
): Promise<MentorChecklistDefinition> {
  return apiClient<MentorChecklistDefinition>("/mentor/checklist-items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMentorChecklistDefinition(
  itemId: string,
  payload: MentorChecklistDefinitionUpdate
): Promise<MentorChecklistDefinition> {
  return apiClient<MentorChecklistDefinition>(`/mentor/checklist-items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function setMentorChecklistDefinitionActive(
  itemId: string,
  isActive: boolean
): Promise<MentorChecklistDefinition> {
  return apiClient<MentorChecklistDefinition>(
    `/mentor/checklist-items/${itemId}/activation`,
    {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    }
  );
}

export async function reviewChecklistItem(
  teamId: string,
  itemId: string,
  fellowId: string,
  payload: MentorChecklistReviewPayload
): Promise<void> {
  await apiClient<unknown>(
    `/mentor/teams/${teamId}/checklist/${itemId}/fellows/${fellowId}/review`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

// ─── Checklist Feedback Thread ───────────────────────────────────────────────

export async function getChecklistFeedback(
  teamId: string,
  itemId: string,
  fellowId: string
): Promise<ChecklistFeedbackThreadResponse> {
  return apiClient<ChecklistFeedbackThreadResponse>(
    `/mentor/teams/${teamId}/checklist/${itemId}/fellows/${fellowId}/feedback`
  );
}

export async function postChecklistFeedback(
  teamId: string,
  itemId: string,
  fellowId: string,
  message: string
): Promise<ChecklistFeedbackMessage> {
  return apiClient<ChecklistFeedbackMessage>(
    `/mentor/teams/${teamId}/checklist/${itemId}/fellows/${fellowId}/feedback`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    }
  );
}

// ─── Submission Insights ────────────────────────────────────────────────────

export async function getTeamSubmissions(teamId: string): Promise<TeamSubmissionsResponse> {
  return apiClient<TeamSubmissionsResponse>(`/mentor/teams/${teamId}/submissions`);
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getMentorNotifications(): Promise<MentorNotificationsResponse> {
  return apiClient<MentorNotificationsResponse>("/mentor/notifications");
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiClient<void>(`/mentor/notifications/${notificationId}/read`, {
    method: "POST",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient<void>("/mentor/notifications/read-all", {
    method: "POST",
  });
}

// ─── Working Board & Mentor Insights ────────────────────────────────

export async function getMentorWorkingBoards(
  sessionId?: string,
  teamId?: string
): Promise<MentorWorkingBoardSummary[]> {
  const params = new URLSearchParams();
  if (sessionId) params.set("session_id", sessionId);
  if (teamId) params.set("team_id", teamId);
  const query = params.toString();
  return apiClient<MentorWorkingBoardSummary[]>(
    query ? `/mentor/working-boards?${query}` : "/mentor/working-boards"
  );
}

export async function getMentorWorkingBoard(
  boardId: string
): Promise<MentorWorkingBoardDetail> {
  return apiClient<MentorWorkingBoardDetail>(`/mentor/working-boards/${boardId}`);
}

export async function getMentorWorkingBoardInsights(
  boardId: string
): Promise<MentorWorkingBoardInsightsDetail | null> {
  try {
    return await apiClient<MentorWorkingBoardInsightsDetail>(
      `/mentor/working-boards/${boardId}/insights`
    );
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "status" in err && (err as { status: number }).status === 404) {
      return null;
    }
    throw err;
  }
}

export async function upsertMentorWorkingBoardInsights(
  boardId: string,
  payload: MentorWorkingBoardInsightsUpsertPayload
): Promise<MentorWorkingBoardInsightsDetail> {
  return apiClient<MentorWorkingBoardInsightsDetail>(
    `/mentor/working-boards/${boardId}/insights`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export async function publishMentorWorkingBoardInsights(
  boardId: string
): Promise<MentorWorkingBoardInsightsDetail> {
  return apiClient<MentorWorkingBoardInsightsDetail>(
    `/mentor/working-boards/${boardId}/insights/publish`,
    {
      method: "POST",
    }
  );
}

export async function getMentorTeamSession(
  teamId: string,
  sessionId: string
): Promise<MentorSessionDetail> {
  return apiClient<MentorSessionDetail>(
    `/mentor/teams/${teamId}/sessions/${sessionId}`
  );
}

// --- Phase Gate Assessment ---

export async function getMentorPhaseGate(teamId: string): Promise<PhaseGateAssessment> {
  return apiClient<PhaseGateAssessment>(`/mentor/teams/${teamId}/phase-gate`);
}

export async function saveMentorPhaseGateDraft(
  teamId: string,
  payload: PhaseGateSavePayload
): Promise<PhaseGateAssessment> {
  return apiClient<PhaseGateAssessment>(`/mentor/teams/${teamId}/phase-gate/draft`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function submitMentorPhaseGate(
  teamId: string,
  payload: PhaseGateSavePayload
): Promise<PhaseGateAssessment> {
  return apiClient<PhaseGateAssessment>(`/mentor/teams/${teamId}/phase-gate/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
