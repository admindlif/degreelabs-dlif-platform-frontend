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

const CHANNEL_NAME = "dlif-admin-auth-session-v1";
const LOCK_NAME = "dlif-admin-auth-refresh-v1";
const REFRESH_SIGNAL_TTL_MS = 5_000;

export class BrowserSessionCoordinator implements SessionCoordinator {
  private readonly listeners = new Set<SessionEventListener>();
  private readonly channel: BroadcastChannel | null;
  private externalRefreshUntil = 0;

  constructor() {
    this.channel = typeof window !== "undefined" && "BroadcastChannel" in window
      ? new BroadcastChannel(CHANNEL_NAME)
      : null;
    if (this.channel) {
      this.channel.onmessage = (message: MessageEvent<SessionCoordinationEvent>) => this.receive(message.data);
    }
  }

  receive(event: SessionCoordinationEvent): void {
    if (event.type === "refresh-start") this.externalRefreshUntil = Date.now() + REFRESH_SIGNAL_TTL_MS;
    if (["refresh-complete", "refresh-failed", "session-expired", "logout"].includes(event.type)) {
      this.externalRefreshUntil = 0;
    }
    this.listeners.forEach((listener) => { try { listener(event); } catch { /* isolate listeners */ } });
  }

  publish(event: SessionCoordinationEvent): void {
    try { this.channel?.postMessage(event); } catch { /* safe fallback */ }
    this.listeners.forEach((listener) => { try { listener(event); } catch { /* isolate listeners */ } });
  }

  subscribe(listener: SessionEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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
        if (timer) clearTimeout(timer);
        unsubscribe?.();
        resolve(completed);
      };
      unsubscribe = this.subscribe((event) => {
        if (event.type === "refresh-complete") finish(true);
        if (event.type === "refresh-failed" || event.type === "session-expired") finish(false);
      });
      timer = setTimeout(() => finish(false), timeoutMs);
    });
  }

  async runExclusive<T>(work: () => Promise<T>): Promise<T> {
    if (typeof navigator !== "undefined" && navigator.locks?.request) {
      return navigator.locks.request(LOCK_NAME, work);
    }
    return work();
  }

  close(): void {
    this.channel?.close();
    this.listeners.clear();
    this.externalRefreshUntil = 0;
  }
}
