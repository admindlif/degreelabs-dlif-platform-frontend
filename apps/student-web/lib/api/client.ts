import { getApiBaseUrl } from "@/lib/api/config";

const TOKEN_KEY = "dlif_student_token";

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

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl().replace(/\/api\/v1\/?$/, "");
  const path = normalizedEndpoint.startsWith("/api/v1") ? normalizedEndpoint : `/api/v1${normalizedEndpoint}`;
  const url = `${base}${path}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorData: unknown = null;
    try {
      errorData = await res.json();
    } catch {
      // ignore
    }
    const detail =
      typeof errorData === "object" &&
      errorData !== null &&
      "detail" in errorData &&
      typeof errorData.detail === "string"
        ? errorData.detail
        : null;
    const message = detail || `API Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, errorData);
  }

  return res.json();
}
