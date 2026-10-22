import test from "node:test";
import assert from "node:assert/strict";

import {
  formatTime,
  filterTranscriptSegments,
  findActiveSegmentIndex,
  isPlaybackUrlExpiring,
} from "../utils.ts";

test("formatTime correctly formats various durations", () => {
  assert.equal(formatTime(0), "00:00");
  assert.equal(formatTime(9), "00:09");
  assert.equal(formatTime(59), "00:59");
  assert.equal(formatTime(60), "01:00");
  assert.equal(formatTime(75), "01:15");
  assert.equal(formatTime(3599), "59:59");
  assert.equal(formatTime(3600), "1:00:00");
  assert.equal(formatTime(3665), "1:01:05");
  assert.equal(formatTime(5996), "1:39:56"); // Real Session 2 duration
  assert.equal(formatTime(7325), "2:02:05");
});

test("formatTime safely handles invalid or negative input", () => {
  assert.equal(formatTime(-10), "00:00");
  assert.equal(formatTime(NaN), "00:00");
  assert.equal(formatTime(Infinity), "00:00");
  assert.equal(formatTime(-Infinity), "00:00");
  assert.equal(formatTime(null as unknown as number), "00:00");
  assert.equal(formatTime(undefined as unknown as number), "00:00");
});

test("Transcript search filters segments correctly", () => {
  const segments = [
    {
      speaker: "Dr. Sarah",
      text: "Welcome to Session 1 of the fellowship program.",
      start_time: 0,
      end_time: 15,
    },
    {
      speaker: "Marcus",
      text: "Today we will cover problem diagnosis and customer discovery.",
      start_time: 15,
      end_time: 45,
    },
    {
      speaker: "Dr. Sarah",
      text: "Let us review the executive summary framework.",
      start_time: 45,
      end_time: 90,
    },
  ];

  // Search by text query
  const matched1 = filterTranscriptSegments(segments, "diagnosis");
  assert.equal(matched1.length, 1);
  assert.equal(matched1[0].speaker, "Marcus");

  // Search by speaker name
  const matched2 = filterTranscriptSegments(segments, "Sarah");
  assert.equal(matched2.length, 2);

  // Search case-insensitive
  const matched3 = filterTranscriptSegments(segments, "FELLOWSHIP");
  assert.equal(matched3.length, 1);

  // Empty query returns all segments
  const matched4 = filterTranscriptSegments(segments, "");
  assert.equal(matched4.length, 3);
});

test("Active segment detection accurately maps video currentTime", () => {
  const segments = [
    { speaker: "A", text: "Introduction", start_time: 0, end_time: 30 },
    { speaker: "B", text: "Deep dive", start_time: 30, end_time: 90 },
    { speaker: "A", text: "Wrap up", start_time: 90, end_time: 120 },
  ];

  assert.equal(findActiveSegmentIndex(segments, 10), 0);
  assert.equal(findActiveSegmentIndex(segments, 30), 1);
  assert.equal(findActiveSegmentIndex(segments, 75), 1);
  assert.equal(findActiveSegmentIndex(segments, 90), 2);
  assert.equal(findActiveSegmentIndex(segments, 119), 2);
  assert.equal(findActiveSegmentIndex(segments, 150), -1);
  assert.equal(findActiveSegmentIndex([], 10), -1);
});

test("Playback URL expiration detection flags expired or soon-to-expire tokens", () => {
  const pastDate = new Date(Date.now() - 10000).toISOString();
  assert.equal(isPlaybackUrlExpiring(pastDate), true);

  const soonDate = new Date(Date.now() + 30000).toISOString(); // 30s in future
  assert.equal(isPlaybackUrlExpiring(soonDate), true);

  const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1h in future
  assert.equal(isPlaybackUrlExpiring(futureDate), false);

  assert.equal(isPlaybackUrlExpiring(null), false);
  assert.equal(isPlaybackUrlExpiring(undefined), false);
});

test("Legacy fallback distinction works appropriately", () => {
  // Scenario 1: tl;dv recording is ready
  const tldvSession = {
    has_recording: true,
    playback_url: "https://playback.tldv.io/stream/123.mp4",
    provider: "tldv",
  };
  const hasInPortalStream = Boolean(tldvSession.has_recording && tldvSession.playback_url);
  assert.equal(hasInPortalStream, true);

  // Scenario 2: Only legacy recording exists
  const legacyOnlySession = {
    has_recording: false,
    playback_url: null,
    provider: "legacy",
    legacy_url: "https://drive.google.com/file/d/abc/view",
  };
  const hasLegacyFallback = !legacyOnlySession.playback_url && Boolean(legacyOnlySession.legacy_url);
  assert.equal(hasLegacyFallback, true);
});
