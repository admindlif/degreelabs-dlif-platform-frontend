import { apiClient, ApiError } from "./client";
import { FellowContext, FellowHomepageData, FellowHomepageResponse } from "./types";

export async function getFellowContext(): Promise<FellowContext> {
  return apiClient<FellowContext>("/api/v1/fellow/context");
}

/**
 * Fetch the fellow homepage data including phase access status.
 * Falls back gracefully if the backend endpoint doesn't exist yet.
 */
export async function getFellowHomepage(): Promise<FellowHomepageData> {
  return apiClient<FellowHomepageData>("/api/v1/fellow/homepage");
}

/**
 * Check if the homepage endpoint is available (used to decide
 * whether to show real phase access or the static fallback).
 */
export async function tryGetFellowHomepage(): Promise<FellowHomepageData | null> {
  try {
    return await getFellowHomepage();
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 422)) {
      return null;
    }
    throw err;
  }
}
