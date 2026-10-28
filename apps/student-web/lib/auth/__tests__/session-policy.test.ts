import test from "node:test";
import assert from "node:assert/strict";
import {
  canExtendSession,
  formatSessionCountdown,
  getEffectiveDeadline,
  getRemainingSeconds,
  getSessionPhase,
  isAbsoluteExpiryPending,
  SESSION_WARNING_WINDOW_MS,
  type SessionDeadlines,
} from "../session-policy.ts";

test("getEffectiveDeadline selects the earliest deadline", () => {
  assert.equal(SESSION_WARNING_WINDOW_MS, 5 * 60 * 1000);
  const deadlines: SessionDeadlines = {
    inactivity_expires_at: "2026-10-29T10:00:00Z",
    absolute_expires_at: "2026-10-30T10:00:00Z",
    effective_expires_at: "2026-10-29T12:00:00Z",
  };
  const expected = Date.parse("2026-10-29T10:00:00Z");
  assert.equal(getEffectiveDeadline(deadlines), expected);
});

test("getEffectiveDeadline safely handles missing or invalid dates", () => {
  const deadlines: SessionDeadlines = {
    inactivity_expires_at: "invalid-date",
    absolute_expires_at: "2026-10-30T10:00:00Z",
    effective_expires_at: "",
  };
  assert.equal(getEffectiveDeadline(deadlines), Date.parse("2026-10-30T10:00:00Z"));
});

test("getSessionPhase detects active, warning, and expired phases", () => {
  const now = Date.parse("2026-10-29T12:00:00Z");

  // 10 minutes remaining -> active
  const activeDeadlines: SessionDeadlines = {
    inactivity_expires_at: "2026-10-29T12:10:00Z",
    absolute_expires_at: "2026-10-30T12:00:00Z",
    effective_expires_at: "2026-10-29T12:10:00Z",
  };
  assert.equal(getSessionPhase(activeDeadlines, now), "active");

  // Exactly 5 minutes remaining -> warning
  const warningBoundaryDeadlines: SessionDeadlines = {
    inactivity_expires_at: "2026-10-29T12:05:00Z",
    absolute_expires_at: "2026-10-30T12:00:00Z",
    effective_expires_at: "2026-10-29T12:05:00Z",
  };
  assert.equal(getSessionPhase(warningBoundaryDeadlines, now), "warning");

  // 2 minutes remaining -> warning
  const warningDeadlines: SessionDeadlines = {
    inactivity_expires_at: "2026-10-29T12:02:00Z",
    absolute_expires_at: "2026-10-30T12:00:00Z",
    effective_expires_at: "2026-10-29T12:02:00Z",
  };
  assert.equal(getSessionPhase(warningDeadlines, now), "warning");

  // 0 seconds remaining -> expired
  const expiredDeadlines: SessionDeadlines = {
    inactivity_expires_at: "2026-10-29T12:00:00Z",
    absolute_expires_at: "2026-10-30T12:00:00Z",
    effective_expires_at: "2026-10-29T12:00:00Z",
  };
  assert.equal(getSessionPhase(expiredDeadlines, now), "expired");

  // Past deadline -> expired
  const pastDeadlines: SessionDeadlines = {
    inactivity_expires_at: "2026-10-29T11:59:00Z",
    absolute_expires_at: "2026-10-30T12:00:00Z",
    effective_expires_at: "2026-10-29T11:59:00Z",
  };
  assert.equal(getSessionPhase(pastDeadlines, now), "expired");
});

test("getRemainingSeconds computes whole seconds remaining or zero", () => {
  const now = Date.parse("2026-10-29T12:00:00Z");
  const deadlines: SessionDeadlines = {
    inactivity_expires_at: "2026-10-29T12:01:30Z",
    absolute_expires_at: "2026-10-30T12:00:00Z",
    effective_expires_at: "2026-10-29T12:01:30Z",
  };
  assert.equal(getRemainingSeconds(deadlines, now), 90);

  const expiredDeadlines: SessionDeadlines = {
    inactivity_expires_at: "2026-10-29T11:59:00Z",
    absolute_expires_at: "2026-10-30T12:00:00Z",
    effective_expires_at: "2026-10-29T11:59:00Z",
  };
  assert.equal(getRemainingSeconds(expiredDeadlines, now), 0);
});

test("formatSessionCountdown formats minutes and seconds with padding", () => {
  assert.equal(formatSessionCountdown(300), "05:00");
  assert.equal(formatSessionCountdown(65), "01:05");
  assert.equal(formatSessionCountdown(9), "00:09");
  assert.equal(formatSessionCountdown(0), "00:00");
  assert.equal(formatSessionCountdown(-15), "00:00");
  assert.equal(formatSessionCountdown(NaN), "00:00");
});

test("isAbsoluteExpiryPending and canExtendSession distinguish absolute expiry from inactivity", () => {
  const now = Date.parse("2026-10-29T12:00:00Z");

  // Absolute expiry is 4 minutes away (within 5 min window)
  const absolutePending: SessionDeadlines = {
    inactivity_expires_at: "2026-10-29T12:15:00Z",
    absolute_expires_at: "2026-10-29T12:04:00Z",
    effective_expires_at: "2026-10-29T12:04:00Z",
  };
  assert.equal(isAbsoluteExpiryPending(absolutePending, now), true);
  assert.equal(canExtendSession(absolutePending, now), false);

  // Inactivity is 4 minutes away, but absolute expiry is 5 days away
  const inactivityPending: SessionDeadlines = {
    inactivity_expires_at: "2026-10-29T12:04:00Z",
    absolute_expires_at: "2026-11-03T12:00:00Z",
    effective_expires_at: "2026-10-29T12:04:00Z",
  };
  assert.equal(isAbsoluteExpiryPending(inactivityPending, now), false);
  assert.equal(canExtendSession(inactivityPending, now), true);
});

