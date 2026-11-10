export const MENTOR_DRAFT_PREFIX = "dlif:mentor-draft:v1:";
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MENTOR_DRAFT_TTL_MS = DRAFT_TTL_MS;

interface DraftEnvelope<T> {
  value: T;
  expiresAt: number;
}
export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly length: number;
  key(index: number): string | null;
}

export function buildDraftKey(
  portal: string,
  userId: string | null | undefined,
  ...parts: string[]
): string {
  const safeUser = userId && userId.trim() ? userId.trim() : "anonymous";
  const prefix = `dlif:${portal}-draft:v1:${encodeURIComponent(safeUser)}:`;
  return `${prefix}${parts.map(encodeURIComponent).join(":")}`;
}

export function mentorDraftKey(
  userIdOrFirstPart?: string | null,
  ...remainingParts: string[]
): string {
  if (remainingParts.length > 0) {
    return buildDraftKey("mentor", userIdOrFirstPart, ...remainingParts);
  }
  const part = userIdOrFirstPart ?? "";
  return buildDraftKey("mentor", "anonymous", part);
}

export function saveExpiringDraft<T>(
  storage: DraftStorage,
  key: string,
  value: T,
  now = Date.now(),
  ttlMs = DRAFT_TTL_MS
): void {
  const envelope: DraftEnvelope<T> = {
    value,
    expiresAt: now + ttlMs,
  };
  try {
    storage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Storage might be full or disabled in private browsing.
  }
}

export function loadExpiringDraft<T>(
  storage: DraftStorage,
  key: string,
  now = Date.now()
): T | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as DraftEnvelope<T>;
    if (typeof envelope?.expiresAt !== "number" || !("value" in envelope)) {
      storage.removeItem(key);
      return null;
    }
    if (envelope.expiresAt <= now) {
      storage.removeItem(key);
      return null;
    }
    return envelope.value;
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // ignore
    }
    return null;
  }
}

export function removeDraft(storage: DraftStorage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

export function clearPortalDrafts(
  storage: DraftStorage,
  portal: string,
  userId?: string | null
): void {
  const targetPrefix =
    userId && userId.trim()
      ? `dlif:${portal}-draft:v1:${encodeURIComponent(userId.trim())}:`
      : `dlif:${portal}-draft:v1:`;

  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(targetPrefix)) keys.push(key);
  }
  keys.forEach((key) => {
    try {
      storage.removeItem(key);
    } catch {
      // ignore
    }
  });
}

export function clearMentorDrafts(storage: DraftStorage, userId?: string | null): void {
  clearPortalDrafts(storage, "mentor", userId);
}
