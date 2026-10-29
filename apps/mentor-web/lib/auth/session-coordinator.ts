import type { SessionStatus } from "./session-client.ts";

export type SessionCoordinationEvent =
  | { type: "refresh-start" }
  | { type: "refresh-complete"; status?: SessionStatus }
  | { type: "refresh-failed" }
  | { type: "session-updated"; status: SessionStatus }
  | { type: "session-expired" }
  | { type: "logout" };

export type SessionEventListener = (event: SessionCoordinationEvent) => void;

export interface SessionCoordinator {
  publish(event: SessionCoordinationEvent): void;
  subscribe(listener: SessionEventListener): () => void;
  isExternalRefreshActive(): boolean;
  waitForExternalRefresh(timeoutMs: number): Promise<boolean>;
  runExclusive<T>(work: () => Promise<T>): Promise<T>;
  close?(): void;
}

const CHANNEL_NAME = "dlif-mentor-auth-session-v1";
const LOCK_NAME = "dlif-mentor-auth-refresh-v1";
const REFRESH_SIGNAL_TTL_MS = 5_000;

export class BrowserSessionCoordinator implements SessionCoordinator {
  private readonly listeners = new Set<SessionEventListener>();
  private readonly channel: BroadcastChannel | null;
  private externalRefreshUntil = 0;

  constructor() {
    this.channel =
      typeof window !== "undefined" && "BroadcastChannel" in window
        ? new BroadcastChannel(CHANNEL_NAME)
        : null;

    if (this.channel) {
      this.channel.onmessage = (message: MessageEvent<SessionCoordinationEvent>) => {
        this.receive(message.data);
      };
    }
  }

  receive(event: SessionCoordinationEvent): void {
    if (event.type === "refresh-start") {
      this.externalRefreshUntil = Date.now() + REFRESH_SIGNAL_TTL_MS;
    } else if (
      event.type === "refresh-complete" ||
      event.type === "refresh-failed" ||
      event.type === "session-expired" ||
      event.type === "logout"
    ) {
      this.externalRefreshUntil = 0;
    }
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Prevent faulty listener from interrupting dispatch
      }
    });
  }

  publish(event: SessionCoordinationEvent): void {
    try {
      this.channel?.postMessage(event);
    } catch {
      // Channel may be closed or restricted in some iframe contexts
    }
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Prevent faulty listener from interrupting dispatch
      }
    });
  }

  subscribe(listener: SessionEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  isExternalRefreshActive(): boolean {
    return this.externalRefreshUntil > Date.now();
  }

  waitForExternalRefresh(timeoutMs: number): Promise<boolean> {
    if (!this.isExternalRefreshActive()) return Promise.resolve(false);

    return new Promise((resolve) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      let unsubscribe: (() => void) | null = null;

      const finish = (completed: boolean) => {
        if (settled) return;
        settled = true;
        if (timer !== null) clearTimeout(timer);
        if (unsubscribe) unsubscribe();
        resolve(completed);
      };

      unsubscribe = this.subscribe((event) => {
        if (event.type === "refresh-complete") finish(true);
        if (event.type === "refresh-failed" || event.type === "session-expired") {
          finish(false);
        }
      });

      timer = setTimeout(() => finish(false), timeoutMs);
    });
  }

  async runExclusive<T>(work: () => Promise<T>): Promise<T> {
    if (
      typeof navigator !== "undefined" &&
      navigator.locks &&
      typeof navigator.locks.request === "function"
    ) {
      return navigator.locks.request(LOCK_NAME, work);
    }
    return work();
  }

  close(): void {
    try {
      this.channel?.close();
    } catch {
      // Ignore errors on close
    }
    this.listeners.clear();
  }
}
