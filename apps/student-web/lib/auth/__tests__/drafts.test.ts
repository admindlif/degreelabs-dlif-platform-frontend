import test from "node:test";
import assert from "node:assert/strict";
import {
  clearFellowDrafts,
  fellowDraftKey,
  FELLOW_DRAFT_PREFIX,
  FELLOW_DRAFT_TTL_MS,
  loadExpiringDraft,
  removeDraft,
  saveExpiringDraft,
  type DraftStorage,
} from "../drafts.ts";

class MemoryStorage implements DraftStorage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
}

test("fellowDraftKey formats prefixed and encoded keys", () => {
  assert.equal(FELLOW_DRAFT_TTL_MS, 24 * 60 * 60 * 1000);
  const key = fellowDraftKey("checklist", "item-123/special");
  assert.equal(key, `${FELLOW_DRAFT_PREFIX}checklist:item-123%2Fspecial`);
});

test("saveExpiringDraft stores draft with timestamp envelope", () => {
  const storage = new MemoryStorage();
  const now = 1000000;
  saveExpiringDraft(storage, "my-key", { text: "hello" }, now, 60000);

  const raw = storage.getItem("my-key");
  assert.ok(raw);
  const parsed = JSON.parse(raw);
  assert.deepEqual(parsed, {
    value: { text: "hello" },
    expiresAt: now + 60000,
  });
});

test("loadExpiringDraft retrieves unexpired draft", () => {
  const storage = new MemoryStorage();
  const now = 1000000;
  saveExpiringDraft(storage, "my-key", { reflection: "key takeaway" }, now, 60000);

  const result = loadExpiringDraft<{ reflection: string }>(storage, "my-key", now + 10000);
  assert.deepEqual(result, { reflection: "key takeaway" });
});

test("loadExpiringDraft discards expired draft from storage", () => {
  const storage = new MemoryStorage();
  const now = 1000000;
  saveExpiringDraft(storage, "my-key", { reflection: "stale" }, now, 60000);

  const result = loadExpiringDraft(storage, "my-key", now + 60001);
  assert.equal(result, null);
  assert.equal(storage.getItem("my-key"), null);
});

test("loadExpiringDraft cleans up malformed storage content", () => {
  const storage = new MemoryStorage();
  storage.setItem("my-key", "invalid-json{{{");

  const result = loadExpiringDraft(storage, "my-key");
  assert.equal(result, null);
  assert.equal(storage.getItem("my-key"), null);
});

test("removeDraft deletes target draft", () => {
  const storage = new MemoryStorage();
  storage.setItem("target-key", "value");
  removeDraft(storage, "target-key");
  assert.equal(storage.getItem("target-key"), null);
});

test("clearFellowDrafts purges only DLIF fellow drafts", () => {
  const storage = new MemoryStorage();
  storage.setItem(fellowDraftKey("checklist", "1"), "draft1");
  storage.setItem(fellowDraftKey("session", "2"), "draft2");
  storage.setItem("unrelated_app_setting", "preserve_me");

  clearFellowDrafts(storage);

  assert.equal(storage.getItem(fellowDraftKey("checklist", "1")), null);
  assert.equal(storage.getItem(fellowDraftKey("session", "2")), null);
  assert.equal(storage.getItem("unrelated_app_setting"), "preserve_me");
});

