import test from "node:test";
import assert from "node:assert/strict";
import {
  BrowserSessionCoordinator,
  type SessionCoordinationEvent,
} from "../session-coordinator.ts";

test("SessionCoordinator dispatches events to subscribers", () => {
  const coordinator = new BrowserSessionCoordinator();
  const received: SessionCoordinationEvent[] = [];

  const unsubscribe = coordinator.subscribe((event) => {
    received.push(event);
  });

  coordinator.publish({ type: "refresh-start" });
  coordinator.publish({ type: "logout" });

  assert.equal(received.length, 2);
  assert.equal(received[0].type, "refresh-start");
  assert.equal(received[1].type, "logout");

  unsubscribe();
  coordinator.publish({ type: "session-expired" });

  // No additional events delivered after unsubscribe
  assert.equal(received.length, 2);
  coordinator.close();
});

test("isExternalRefreshActive tracks external refresh signal until completion", () => {
  const coordinator = new BrowserSessionCoordinator();

  assert.equal(coordinator.isExternalRefreshActive(), false);

  // Tab receives refresh-start from another tab
  coordinator.receive({ type: "refresh-start" });
  assert.equal(coordinator.isExternalRefreshActive(), true);

  // Tab receives refresh-complete from the other tab
  coordinator.receive({ type: "refresh-complete" });
  assert.equal(coordinator.isExternalRefreshActive(), false);

  coordinator.close();
});

test("waitForExternalRefresh resolves true on refresh-complete", async () => {
  const coordinator = new BrowserSessionCoordinator();
  coordinator.receive({ type: "refresh-start" });

  const waitPromise = coordinator.waitForExternalRefresh(500);

  // Simulate remote tab completing refresh
  setTimeout(() => {
    coordinator.receive({ type: "refresh-complete" });
  }, 20);

  const result = await waitPromise;
  assert.equal(result, true);
  coordinator.close();
});

test("waitForExternalRefresh resolves false on refresh-failed", async () => {
  const coordinator = new BrowserSessionCoordinator();
  coordinator.receive({ type: "refresh-start" });

  const waitPromise = coordinator.waitForExternalRefresh(500);

  setTimeout(() => {
    coordinator.receive({ type: "refresh-failed" });
  }, 20);

  const result = await waitPromise;
  assert.equal(result, false);
  coordinator.close();
});

test("waitForExternalRefresh resolves false when timed out", async () => {
  const coordinator = new BrowserSessionCoordinator();
  coordinator.receive({ type: "refresh-start" });

  const result = await coordinator.waitForExternalRefresh(30);
  assert.equal(result, false);
  coordinator.close();
});

test("runExclusive executes async work cleanly", async () => {
  const coordinator = new BrowserSessionCoordinator();
  let executed = false;

  const result = await coordinator.runExclusive(async () => {
    executed = true;
    return "done";
  });

  assert.equal(executed, true);
  assert.equal(result, "done");
  coordinator.close();
});
