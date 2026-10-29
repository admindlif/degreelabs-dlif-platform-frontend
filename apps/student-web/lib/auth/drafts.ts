export const FELLOW_DRAFT_PREFIX = "dlif:fellow-draft:v1:";
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
export const FELLOW_DRAFT_TTL_MS = DRAFT_TTL_MS;

interface DraftEnvelope<T> {
  value: T;
  expiresAt: number;
}

export interface DraftStorage {
  readonly length: number;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
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

export function fellowDraftKey(
  userId: string | null | undefined,
  ...parts: string[]
): string {
  return buildDraftKey("fellow", userId, ...parts);
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
  storage.setItem(key, JSON.stringify(envelope));
}

export function loadExpiringDraft<T>(
  storage: DraftStorage,
  key: string,
  now = Date.now()
): T | null {
  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    const envelope = JSON.parse(raw) as Partial<DraftEnvelope<T>>;
    if (
      typeof envelope.expiresAt !== "number" ||
      envelope.expiresAt <= now ||
      !("value" in envelope)
    ) {
      storage.removeItem(key);
      return null;
    }
    return envelope.value as T;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

export function removeDraft(storage: DraftStorage, key: string): void {
  storage.removeItem(key);
}

export function clearPortalDrafts(
  storage: DraftStorage,
  portal: string,
  userId?: string | null
): void {
  const targetPrefix = userId && userId.trim()
    ? `dlif:${portal}-draft:v1:${encodeURIComponent(userId.trim())}:`
    : `dlif:${portal}-draft:v1:`;

  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(targetPrefix)) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
}

export function clearFellowDrafts(storage: DraftStorage, userId?: string | null): void {
  clearPortalDrafts(storage, "fellow", userId);
}
