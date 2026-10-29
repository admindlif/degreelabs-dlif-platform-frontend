import test from "node:test";
import assert from "node:assert/strict";
import {
  ABSOLUTE_SESSION_LIFETIME_MS,
  SESSION_WARNING_WINDOW_MS,
  canExtendSession,
  formatSessionCountdown,
  getEffectiveDeadline,
  getRemainingSeconds,
  getSessionPhase,
  type SessionDeadlines,
} from "../session-policy.ts";

const now = Date.parse("2026-10-29T12:00:00Z");

test("Admin sessions use a 24-hour absolute limit and five-minute warning", () => {
  assert.equal(ABSOLUTE_SESSION_LIFETIME_MS, 24 * 60 * 60 * 1000);
  assert.equal(SESSION_WARNING_WINDOW_MS, 5 * 60 * 1000);
});

test("the earliest server deadline controls the session phase", () => {
  const deadlines: SessionDeadlines = {
    inactivity_expires_at: "2026-10-29T12:04:00Z",
    absolute_expires_at: "2026-10-30T12:00:00Z",
    effective_expires_at: "2026-10-29T12:04:00Z",
  };
  assert.equal(getEffectiveDeadline(deadlines), Date.parse(deadlines.inactivity_expires_at));
  assert.equal(getSessionPhase(deadlines, now), "warning");
  assert.equal(getRemainingSeconds(deadlines, now), 240);
  assert.equal(canExtendSession(deadlines, now), true);
});

test("absolute expiry cannot be extended", () => {
  const deadlines: SessionDeadlines = {
    inactivity_expires_at: "2026-10-29T12:20:00Z",
    absolute_expires_at: "2026-10-29T12:04:00Z",
    effective_expires_at: "2026-10-29T12:04:00Z",
  };
  assert.equal(canExtendSession(deadlines, now), false);
  assert.equal(getSessionPhase({ ...deadlines, absolute_expires_at: new Date(now).toISOString() }, now), "expired");
  assert.equal(formatSessionCountdown(65), "01:05");
});
