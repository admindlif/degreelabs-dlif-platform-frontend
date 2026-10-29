import { getApiBaseUrl } from "../api/config.ts";
import {
  BrowserSessionCoordinator,
  type SessionCoordinationEvent,
  type SessionCoordinator,
} from "./session-coordinator.ts";

export interface SessionStatus {
  authenticated: boolean;
  inactivity_expires_at: string | null;
  absolute_expires_at: string | null;
  effective_expires_at: string | null;
  access_expires_at: string | null;
  server_time: string;
}

export interface SessionActivity {
  inactivity_expires_at: string;
  absolute_expires_at: string;
  effective_expires_at: string;
  server_time: string;
}

export class SessionNetworkError extends Error {
  constructor(message = "Unable to contact the authentication service.", options?: ErrorOptions) {
    super(message, options);
    this.name = "SessionNetworkError";
  }
}

export interface SessionClientOptions {
  fetcher?: typeof fetch;
  baseUrl?: () => string;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  coordinator?: SessionCoordinator;
}

const ACCESS_CLOCK_SKEW_MS = 5_000;
const EXTERNAL_REFRESH_WAIT_MS = 1_500;
const RACE_RETRY_DELAYS_MS = [150, 300, 600, 1000];

export function accessTokenIsCurrent(status: SessionStatus, now: number): boolean {
  if (!status.authenticated || !status.access_expires_at) return false;
  const expiry = Date.parse(status.access_expires_at);
  return Number.isFinite(expiry) && expiry > now + ACCESS_CLOCK_SKEW_MS;
}

export class MentorSessionClient {
  private readonly fetcher: typeof fetch;
  private readonly baseUrl: () => string;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly coordinator: SessionCoordinator;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(options: SessionClientOptions = {}) {
    this.fetcher = options.fetcher ?? ((...args) => fetch(...args));
    this.baseUrl = options.baseUrl ?? getApiBaseUrl;
    this.now = options.now ?? Date.now;
    this.sleep =
      options.sleep ??
      ((milliseconds) =>
        new Promise((resolve) => {
          setTimeout(resolve, milliseconds);
        }));
    this.coordinator = options.coordinator ?? new BrowserSessionCoordinator();
  }

  private authUrl(path: string): string {
    return `${this.baseUrl().replace(/\/api\/v1\/?$/, "")}/api/v1/auth/${path}`;
  }

  subscribe(listener: (event: SessionCoordinationEvent) => void): () => void {
    return this.coordinator.subscribe(listener);
  }

  announce(event: SessionCoordinationEvent): void {
    this.coordinator.publish(event);
  }

  getCoordinator(): SessionCoordinator {
    return this.coordinator;
  }

  async getStatus(): Promise<SessionStatus> {
    let response: Response;
    try {
      response = await this.fetcher(this.authUrl("session"), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
    } catch (error) {
      throw new SessionNetworkError(
        error instanceof Error ? error.message : "Unable to validate the current session.",
        { cause: error }
      );
    }
    if (!response.ok) {
      throw new SessionNetworkError("Unable to validate the current session.");
    }
    return response.json() as Promise<SessionStatus>;
  }

  async recordActivity(): Promise<SessionActivity | null> {
    let response = await this.sendActivityRequest();
    if (response.status === 401 && (await this.renewAccess())) {
      response = await this.sendActivityRequest();
    }

    if (response.status === 401) {
      this.coordinator.publish({ type: "session-expired" });
      return null;
    }
    if (!response.ok) {
      throw new SessionNetworkError("Unable to update session activity.");
    }
    return response.json() as Promise<SessionActivity>;
  }

  private async sendActivityRequest(): Promise<Response> {
    let response: Response;
    try {
      response = await this.fetcher(this.authUrl("activity"), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch (error) {
      throw new SessionNetworkError(
        error instanceof Error ? error.message : "Unable to contact the authentication service.",
        { cause: error }
      );
    }
    return response;
  }

  renewAccess(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.coordinator
      .runExclusive(async () => {
        if (this.coordinator.isExternalRefreshActive()) {
          await this.coordinator.waitForExternalRefresh(EXTERNAL_REFRESH_WAIT_MS);
        }

        const current = await this.getStatus();
        if (!current.authenticated) {
          this.coordinator.publish({ type: "session-expired" });
          return false;
        }
        if (accessTokenIsCurrent(current, this.now())) {
          this.coordinator.publish({ type: "session-updated", status: current });
          return true;
        }

        return this.performRefresh();
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private async performRefresh(): Promise<boolean> {
    this.coordinator.publish({ type: "refresh-start" });
    let response: Response;
    try {
      response = await this.fetcher(this.authUrl("refresh"), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch (error) {
      this.coordinator.publish({ type: "refresh-failed" });
      throw new SessionNetworkError(
        error instanceof Error ? error.message : "The authentication service is unavailable.",
        { cause: error }
      );
    }

    if (response.ok) {
      const status = await this.getStatus();
      this.coordinator.publish({ type: "refresh-complete", status });
      return status.authenticated;
    }

    if (response.status === 409) {
      for (const delay of RACE_RETRY_DELAYS_MS) {
        await this.sleep(delay);
        const status = await this.getStatus();
        if (accessTokenIsCurrent(status, this.now())) {
          this.coordinator.publish({ type: "refresh-complete", status });
          return true;
        }
      }
      this.coordinator.publish({ type: "refresh-failed" });
      return false;
    }

    if (response.status === 401) {
      this.coordinator.publish({ type: "session-expired" });
      return false;
    }

    this.coordinator.publish({ type: "refresh-failed" });
    throw new SessionNetworkError("The authentication service could not renew the session.");
  }
}

export const mentorSessionClient = new MentorSessionClient();
