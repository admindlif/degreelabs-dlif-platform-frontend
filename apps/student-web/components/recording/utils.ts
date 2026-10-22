/**
 * Format duration in seconds to standard HH:MM:SS or MM:SS timestamp.
 */
export function formatTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Filter transcript segments by search term across text and speaker.
 */
export function filterTranscriptSegments<
  T extends { text: string; speaker?: string | null }
>(segments: T[], query: string): T[] {
  if (!query || !query.trim()) return segments;
  const lower = query.toLowerCase();
  return segments.filter(
    (seg) =>
      seg.text.toLowerCase().includes(lower) ||
      (seg.speaker && seg.speaker.toLowerCase().includes(lower))
  );
}

/**
 * Find the index of the active segment matching current video playback time.
 */
export function findActiveSegmentIndex<
  T extends { start_time: number; end_time?: number | null }
>(segments: T[], currentTime: number): number {
  if (!segments.length) return -1;
  return segments.findIndex((seg, idx) => {
    const nextSeg = segments[idx + 1];
    const endTime =
      seg.end_time ?? (nextSeg ? nextSeg.start_time : seg.start_time + 10);
    return currentTime >= seg.start_time && currentTime < endTime;
  });
}

/**
 * Check whether a playback URL is expired or close to expiration.
 */
export function isPlaybackUrlExpiring(
  expiresAt: string | null | undefined,
  thresholdMs = 60000
): boolean {
  if (!expiresAt) return false;
  const expiresTime = new Date(expiresAt).getTime();
  const now = Date.now();
  return expiresTime - now < thresholdMs;
}
