import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_DRAFT_TTL_MS,
  adminDraftKey,
  clearAdminDrafts,
  loadExpiringDraft,
  saveExpiringDraft,
  type DraftStorage,
} from "../drafts.ts";

class MemoryStorage implements DraftStorage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
}

test("Admin drafts expire after 24 hours", () => {
  assert.equal(ADMIN_DRAFT_TTL_MS, 24 * 60 * 60 * 1000);
  const storage = new MemoryStorage();
  saveExpiringDraft(storage, "draft", { text: "keep" }, 1_000, 100);
  assert.deepEqual(loadExpiringDraft(storage, "draft", 1_050), { text: "keep" });
  assert.equal(loadExpiringDraft(storage, "draft", 1_101), null);
});

test("Admin draft keys isolate users and logout clearing is scoped", () => {
  const storage = new MemoryStorage();
  const keyA = adminDraftKey("admin-a", "review", "1");
  const keyB = adminDraftKey("admin-b", "review", "1");
  assert.notEqual(keyA, keyB);
  storage.setItem(keyA, "a");
  storage.setItem(keyB, "b");
  storage.setItem("unrelated", "preserve");
  clearAdminDrafts(storage, "admin-a");
  assert.equal(storage.getItem(keyA), null);
  assert.equal(storage.getItem(keyB), "b");
  assert.equal(storage.getItem("unrelated"), "preserve");
});
