import { apiClient } from "./client";
import {
  DiscoverOverview,
  DiscoverWeek,
  PhaseResource,
  SessionDetail,
  SessionSummary,
  SessionSubmissionResponse,
  SubmissionFeedback,
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
