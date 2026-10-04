import { getApiBaseUrl } from "@/lib/api/config";

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
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl().replace(/\/api\/v1\/?$/, "");
  const path = normalizedEndpoint.startsWith("/api/v1") ? normalizedEndpoint : `/api/v1${normalizedEndpoint}`;
  const url = `${base}${path}`;

  const res = await fetch(url, {
    ...options,
    credentials: "include",
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
