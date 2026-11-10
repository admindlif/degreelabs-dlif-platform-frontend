import { getApiBaseUrl } from "./config.ts";
import {
  mentorSessionClient,
  SessionNetworkError,
} from "../auth/session-client.ts";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl().replace(/\/api\/v1\/?$/, "");
  const path = normalizedEndpoint.startsWith("/api/v1") ? normalizedEndpoint : `/api/v1${normalizedEndpoint}`;
  const url = `${base}${path}`;

  const method = (options.method ?? "GET").toUpperCase();
  const canRetry = ["GET", "HEAD", "OPTIONS"].includes(method);
  const execute = () =>
    fetch(url, {
      cache: "no-store",
      ...options,
      credentials: "include",
      headers,
    });

  let res = await execute();

  if (res.status === 401) {
    let renewed = false;
    try {
      renewed = await mentorSessionClient.renewAccess();
    } catch (error) {
      if (error instanceof SessionNetworkError) {
        throw new ApiError(
          "The authentication service is temporarily unavailable. Your work has not been discarded.",
          0
        );
      }
      throw error;
    }

    if (renewed && canRetry) {
      res = await execute();
    } else if (renewed) {
      throw new ApiError(
        "Your session was renewed. Please submit this action again.",
        401
      );
    }
  }

  if (!res.ok) {
    let errorData: unknown = null;
    try {
      errorData = await res.json();
    } catch {
      // ignore non-JSON body
    }

    if (res.status === 401) {
      throw new ApiError(
        "Your session has expired. Please sign in again.",
        res.status,
        errorData
      );
    }

    const detail =
      typeof errorData === "object" &&
      errorData !== null &&
      "detail" in errorData &&
      typeof (errorData as { detail: unknown }).detail === "string"
        ? (errorData as { detail: string }).detail
        : null;

    if (res.status === 403) {
      throw new ApiError(
        detail || "You do not have permission to perform this action.",
        res.status,
        errorData
      );
    }

    const message = detail || `API Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, errorData);
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json();
}
