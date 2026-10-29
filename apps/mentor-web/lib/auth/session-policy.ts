export const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000; // 15 minutes
export const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
export const ABSOLUTE_SESSION_LIFETIME_MS = 3 * 24 * 60 * 60 * 1000; // 3 days (72 hours) for Mentor Portal
export const SESSION_WARNING_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
export const EXPIRATION_WARNING_WINDOW_MS = SESSION_WARNING_WINDOW_MS;
export const CLOCK_SKEW_TOLERANCE_MS = 30 * 1000; // 30 seconds
export const ACTIVITY_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export interface SessionDeadlines {
  inactivity_expires_at: string;
  absolute_expires_at: string;
  effective_expires_at: string;
}

export type SessionPhase = "active" | "warning" | "expired";

function parseDateSafe(dateStr: string | null | undefined): number {
  if (!dateStr) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(dateStr);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

export function getEffectiveDeadline(deadlines: SessionDeadlines): number {
  const inactivity = parseDateSafe(deadlines.inactivity_expires_at);
  const absolute = parseDateSafe(deadlines.absolute_expires_at);
  const effective = parseDateSafe(deadlines.effective_expires_at);

  return Math.min(inactivity, absolute, effective);
}

export function isAbsoluteExpiryPending(
  deadlines: SessionDeadlines,
  now: number,
  warningWindowMs = SESSION_WARNING_WINDOW_MS
): boolean {
  const absolute = parseDateSafe(deadlines.absolute_expires_at);
  if (!Number.isFinite(absolute)) return false;
  return absolute - now <= warningWindowMs;
}

export function canExtendSession(
  deadlines: SessionDeadlines,
  now: number,
  warningWindowMs = SESSION_WARNING_WINDOW_MS
): boolean {
  const absolute = parseDateSafe(deadlines.absolute_expires_at);
  if (!Number.isFinite(absolute)) return true;
  // If absolute expiry is reached or within the warning window, extension cannot push beyond it.
  return absolute - now > warningWindowMs;
}

export function getSessionPhase(
  deadlines: SessionDeadlines,
  now: number,
  warningWindowMs = SESSION_WARNING_WINDOW_MS
): SessionPhase {
  const effective = getEffectiveDeadline(deadlines);
  if (!Number.isFinite(effective)) return "active";

  const remaining = effective - now;
  if (remaining <= 0) return "expired";
  if (remaining <= warningWindowMs) return "warning";
  return "active";
}

export function getRemainingSeconds(
  deadlines: SessionDeadlines,
  now: number
): number {
  const effective = getEffectiveDeadline(deadlines);
  if (!Number.isFinite(effective)) return 0;
  return Math.max(0, Math.ceil((effective - now) / 1000));
}

export function formatSessionCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
