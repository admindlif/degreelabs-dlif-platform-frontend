export const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000;
export const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000;
export const ABSOLUTE_SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;
export const SESSION_WARNING_WINDOW_MS = 5 * 60 * 1000;
export const ACTIVITY_THROTTLE_MS = 5 * 60 * 1000;

export interface SessionDeadlines {
  inactivity_expires_at: string;
  absolute_expires_at: string;
  effective_expires_at: string;
}

export type SessionPhase = "active" | "warning" | "expired";

export function calculateServerClockOffset(
  serverTime: string,
  requestStartedAt: number,
  responseReceivedAt: number
): number {
  const parsedServerTime = Date.parse(serverTime);
  if (Number.isNaN(parsedServerTime)) return 0;
  const midpoint = requestStartedAt + Math.max(0, responseReceivedAt - requestStartedAt) / 2;
  return parsedServerTime - midpoint;
}

export function getServerAdjustedNow(clockOffsetMs: number, browserNow = Date.now()): number {
  return browserNow + (Number.isFinite(clockOffsetMs) ? clockOffsetMs : 0);
}

function parseDateSafe(value: string | null | undefined): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

export function getEffectiveDeadline(deadlines: SessionDeadlines): number {
  return Math.min(
    parseDateSafe(deadlines.inactivity_expires_at),
    parseDateSafe(deadlines.absolute_expires_at),
    parseDateSafe(deadlines.effective_expires_at)
  );
}

export function canExtendSession(
  deadlines: SessionDeadlines,
  now: number,
  warningWindowMs = SESSION_WARNING_WINDOW_MS
): boolean {
  const absolute = parseDateSafe(deadlines.absolute_expires_at);
  return !Number.isFinite(absolute) || absolute - now > warningWindowMs;
}

export function getSessionPhase(
  deadlines: SessionDeadlines,
  now: number,
  warningWindowMs = SESSION_WARNING_WINDOW_MS
): SessionPhase {
  const deadline = getEffectiveDeadline(deadlines);
  if (!Number.isFinite(deadline)) return "active";
  const remaining = deadline - now;
  if (remaining <= 0) return "expired";
  if (remaining <= warningWindowMs) return "warning";
  return "active";
}

export function getRemainingSeconds(deadlines: SessionDeadlines, now: number): number {
  const deadline = getEffectiveDeadline(deadlines);
  if (!Number.isFinite(deadline)) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function formatSessionCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}
