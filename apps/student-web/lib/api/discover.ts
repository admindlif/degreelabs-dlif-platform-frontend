import { apiClient, ApiError } from "./client";
import {
  DiscoverOverview,
  DiscoverWeek,
  PhaseResource,
  SessionDetail,
  SessionSummary,
  SessionSubmissionResponse,
  SubmissionFeedback,
  SessionRecordingResponse,
  SessionTranscriptResponse,
  FellowWorkingBoardResponse,
  FellowWorkingBoardInsightsResponse,
  SessionOverviewData,
  PhaseGateAssessmentResponse,
} from "./types";

export async function getDiscoverOverview(): Promise<DiscoverOverview> {
  return apiClient<DiscoverOverview>("/api/v1/fellow/discover/overview");
}

export async function getDiscoverWeeks(): Promise<DiscoverWeek[]> {
  return apiClient<DiscoverWeek[]>("/api/v1/fellow/discover/weeks");
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail> {
  return apiClient<SessionDetail>(`/api/v1/fellow/sessions/${sessionId}`);
}

export async function getFellowSessions(): Promise<SessionSummary[]> {
  return apiClient<SessionSummary[]>(
    "/api/v1/fellow/sessions"
  );
}

export async function getSessionResources(
  sessionId: string
): Promise<PhaseResource[]> {
  return apiClient<PhaseResource[]>(
    `/api/v1/fellow/sessions/${sessionId}/resources`
  );
}

export async function getSessionSubmission(
  sessionId: string
): Promise<SessionSubmissionResponse> {
  return apiClient<SessionSubmissionResponse>(
    `/api/v1/fellow/sessions/${sessionId}/submission`
  );
}


export async function saveSessionSubmission(
  sessionId: string,
  driveUrl: string
): Promise<SessionSubmissionResponse> {
  return apiClient<SessionSubmissionResponse>(
    `/api/v1/fellow/sessions/${sessionId}/submission`,
    {
      method: "PUT",
      body: JSON.stringify({
        drive_url: driveUrl,
      }),
    }
  );
}

export async function getSessionFeedback(
  sessionId: string
): Promise<SubmissionFeedback | null> {
  return apiClient<SubmissionFeedback | null>(
    `/api/v1/fellow/sessions/${sessionId}/feedback`
  );
}

export async function getSessionRecording(
  sessionId: string
): Promise<SessionRecordingResponse> {
  return apiClient<SessionRecordingResponse>(
    `/api/v1/fellow/sessions/${sessionId}/recording`
  );
}

export async function getSessionTranscript(
  sessionId: string
): Promise<SessionTranscriptResponse> {
  return apiClient<SessionTranscriptResponse>(
    `/api/v1/fellow/sessions/${sessionId}/transcript`
  );
}

export async function getFellowWorkingBoard(
  sessionId: string
): Promise<FellowWorkingBoardResponse | null> {
  try {
    return await apiClient<FellowWorkingBoardResponse>(
      `/api/v1/fellow/sessions/${sessionId}/working-board`
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function getFellowWorkingBoardInsights(
  sessionId: string
): Promise<FellowWorkingBoardInsightsResponse | null> {
  try {
    return await apiClient<FellowWorkingBoardInsightsResponse>(
      `/api/v1/fellow/sessions/${sessionId}/working-board-insights`
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function getSessionOverview(
  sessionId: string
): Promise<SessionOverviewData | null> {
  try {
    return await apiClient<SessionOverviewData>(
      `/api/v1/fellow/sessions/${sessionId}/overview`
    );
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
      return null;
    }
    throw err;
  }
}

export async function getDiscoverGateAssessment(): Promise<PhaseGateAssessmentResponse> {
  try {
    return await apiClient<PhaseGateAssessmentResponse>(
      `/api/v1/fellow/discover/gate-assessment`
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      // Try fallback alias if needed
      try {
        return await apiClient<PhaseGateAssessmentResponse>(
          `/api/v1/fellow/discover-gate`
        );
      } catch (innerErr) {
        if (innerErr instanceof ApiError && innerErr.status === 404) {
          return { status: "not_submitted", message: "No assessment submitted yet." };
        }
      }
      return { status: "not_submitted", message: "No assessment submitted yet." };
    }
    throw err;
  }
}
