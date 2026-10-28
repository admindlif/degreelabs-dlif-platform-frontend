export const FELLOW_DRAFT_PREFIX = "dlif:fellow-draft:v1:";
export const FELLOW_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

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

export function fellowDraftKey(...parts: string[]): string {
  return `${FELLOW_DRAFT_PREFIX}${parts.map(encodeURIComponent).join(":")}`;
}

export function saveExpiringDraft<T>(
  storage: DraftStorage,
  key: string,
  value: T,
  now = Date.now(),
  ttlMs = FELLOW_DRAFT_TTL_MS
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

export function clearFellowDrafts(storage: DraftStorage): void {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(FELLOW_DRAFT_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
}

