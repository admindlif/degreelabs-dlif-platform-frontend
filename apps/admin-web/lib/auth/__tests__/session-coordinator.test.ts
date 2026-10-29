import test from "node:test";
import assert from "node:assert/strict";
import { BrowserSessionCoordinator } from "../session-coordinator.ts";

test("Admin coordinator publishes and unsubscribes", () => {
  const coordinator = new BrowserSessionCoordinator();
  const events: string[] = [];
  const unsubscribe = coordinator.subscribe((event) => events.push(event.type));
  coordinator.publish({ type: "refresh-start" });
  coordinator.publish({ type: "logout" });
  unsubscribe();
  coordinator.publish({ type: "session-expired" });
  assert.deepEqual(events, ["refresh-start", "logout"]);
  coordinator.close();
});

test("Admin coordinator tracks an external refresh and its completion", async () => {
  const coordinator = new BrowserSessionCoordinator();
  coordinator.receive({ type: "refresh-start" });
  assert.equal(coordinator.isExternalRefreshActive(), true);
  const waiting = coordinator.waitForExternalRefresh(500);
  setTimeout(() => coordinator.receive({ type: "refresh-complete" }), 10);
  assert.equal(await waiting, true);
  assert.equal(coordinator.isExternalRefreshActive(), false);
  coordinator.close();
});
