export const ADMIN_DRAFT_PREFIX = "dlif:admin-draft:v1:";
export const ADMIN_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

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

export function adminDraftKey(userId: string | null | undefined, ...parts: string[]): string {
  const user = userId?.trim() || "anonymous";
  return `${ADMIN_DRAFT_PREFIX}${encodeURIComponent(user)}:${parts.map(encodeURIComponent).join(":")}`;
}

export function saveExpiringDraft<T>(
  storage: DraftStorage,
  key: string,
  value: T,
  now = Date.now(),
  ttlMs = ADMIN_DRAFT_TTL_MS
): void {
  try {
    storage.setItem(key, JSON.stringify({ value, expiresAt: now + ttlMs }));
  } catch {
    // Storage may be disabled or full; the form remains usable in memory.
  }
}

export function loadExpiringDraft<T>(storage: DraftStorage, key: string, now = Date.now()): T | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as DraftEnvelope<T>;
    if (typeof envelope?.expiresAt !== "number" || !("value" in envelope) || envelope.expiresAt <= now) {
      storage.removeItem(key);
      return null;
    }
    return envelope.value;
  } catch {
    try { storage.removeItem(key); } catch { /* ignore cleanup failure */ }
    return null;
  }
}

export function removeDraft(storage: DraftStorage, key: string): void {
  try { storage.removeItem(key); } catch { /* ignore cleanup failure */ }
}

export function clearAdminDrafts(storage: DraftStorage, userId?: string | null): void {
  const prefix = userId?.trim()
    ? `${ADMIN_DRAFT_PREFIX}${encodeURIComponent(userId.trim())}:`
    : ADMIN_DRAFT_PREFIX;
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  keys.forEach((key) => removeDraft(storage, key));
}
