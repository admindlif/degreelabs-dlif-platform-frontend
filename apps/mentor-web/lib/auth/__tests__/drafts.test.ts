import test from "node:test";
import assert from "node:assert/strict";
import {
  clearMentorDrafts,
  mentorDraftKey,
  MENTOR_DRAFT_PREFIX,
  MENTOR_DRAFT_TTL_MS,
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

test("MENTOR_DRAFT_TTL_MS is 24 hours", () => {
  assert.equal(MENTOR_DRAFT_TTL_MS, 24 * 60 * 60 * 1000);
});
test("mentorDraftKey formats prefixed and user-scoped keys", () => {
  const userId = "mentor-user-123";
  const key = mentorDraftKey(userId, "checklist", "item-456/special");
  assert.ok(key.startsWith(MENTOR_DRAFT_PREFIX));
  assert.ok(key.includes(encodeURIComponent(userId)));
  assert.ok(key.includes("checklist"));
  assert.ok(key.includes(encodeURIComponent("item-456/special")));
});

test("mentorDraftKey with no userId falls back to anonymous", () => {
  const key = mentorDraftKey(undefined, "insights", "board-1");
  assert.ok(key.includes("anonymous"));
  assert.ok(key.includes("insights"));
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
  saveExpiringDraft(storage, "my-key", { feedback: "mentor insight" }, now, 60000);

  const result = loadExpiringDraft<{ feedback: string }>(storage, "my-key", now + 10000);
  assert.deepEqual(result, { feedback: "mentor insight" });
});

test("loadExpiringDraft discards expired draft from storage", () => {
  const storage = new MemoryStorage();
  const now = 1000000;
  saveExpiringDraft(storage, "my-key", { feedback: "stale" }, now, 60000);

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

test("clearMentorDrafts purges only DLIF mentor drafts", () => {
  const storage = new MemoryStorage();
  const userId = "mentor-abc";
  storage.setItem(mentorDraftKey(userId, "insights", "board-1"), "draft1");
  storage.setItem(mentorDraftKey(userId, "checklist", "item-2"), "draft2");
  storage.setItem("unrelated_app_setting", "preserve_me");

  clearMentorDrafts(storage, userId);

  assert.equal(storage.getItem(mentorDraftKey(userId, "insights", "board-1")), null);
  assert.equal(storage.getItem(mentorDraftKey(userId, "checklist", "item-2")), null);
  assert.equal(storage.getItem("unrelated_app_setting"), "preserve_me");
});

test("user-scoped draft keys isolate drafts between distinct mentors", () => {
  const mentorA = "mentor-aaa-111";
  const mentorB = "mentor-bbb-222";
  const keyA = mentorDraftKey(mentorA, "phase-gate", "team-99");
  const keyB = mentorDraftKey(mentorB, "phase-gate", "team-99");

  assert.notEqual(keyA, keyB);
  assert.ok(keyA.includes(encodeURIComponent(mentorA)));
  assert.ok(keyB.includes(encodeURIComponent(mentorB)));

  const storage = new MemoryStorage();
  storage.setItem(keyA, JSON.stringify({ value: { notes: "mentor A" }, expiresAt: Date.now() + 60000 }));
  storage.setItem(keyB, JSON.stringify({ value: { notes: "mentor B" }, expiresAt: Date.now() + 60000 }));

  // Clear only mentor A's drafts
  clearMentorDrafts(storage, mentorA);

  assert.equal(storage.getItem(keyA), null);
  assert.notEqual(storage.getItem(keyB), null);
});
