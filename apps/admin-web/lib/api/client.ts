const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export async function adminApiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

  const path = normalizedEndpoint.startsWith("/api/v1")
    ? normalizedEndpoint
    : `/api/v1${normalizedEndpoint}`;

  const url = `${base}${path}`;

  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    let errorData: unknown = null;

    try {
      errorData = await res.json();
    } catch {
      // Response may not contain JSON
    }

    // 401 / 403 → the admin session has expired or the cookie was lost.
    // Redirect to the login page so the admin can re-authenticate without
    // needing to manually sign out and sign back in.
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?session_expired=1";
      }
      // Throw so the calling code stops processing immediately.
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
        typeof errorData.detail === "string"
        ? errorData.detail
        : null;
    const message =
      detail || `Admin API Request failed with status ${res.status}`;

    throw new ApiError(message, res.status, errorData);
  }

  // DELETE endpoints usually return HTTP 204 with an empty body.
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
