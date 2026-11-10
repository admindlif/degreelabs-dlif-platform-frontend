import test from "node:test";
import assert from "node:assert/strict";
import {
  accessTokenIsCurrent,
  FellowSessionClient,
  SessionNetworkError,
  type SessionActivity,
  type SessionStatus,
} from "../session-client.ts";
import { BrowserSessionCoordinator } from "../session-coordinator.ts";

function createMockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("accessTokenIsCurrent checks access expiration against clock skew", () => {
  const now = Date.parse("2026-10-29T12:00:00Z");

  const validStatus: SessionStatus = {
    authenticated: true,
    inactivity_expires_at: "2026-10-30T12:00:00Z",
    absolute_expires_at: "2026-11-05T12:00:00Z",
    effective_expires_at: "2026-10-30T12:00:00Z",
    access_expires_at: new Date(now + 60000).toISOString(), // 60s > 5s skew
    server_time: new Date(now).toISOString(),
  };
  assert.equal(accessTokenIsCurrent(validStatus, now), true);

  // Expiring in 4s (within 5s skew window) -> considered expired
  const skewStatus: SessionStatus = {
    ...validStatus,
    access_expires_at: new Date(now + 4000).toISOString(),
  };
  assert.equal(accessTokenIsCurrent(skewStatus, now), false);

  // Unauthenticated
  assert.equal(accessTokenIsCurrent({ ...validStatus, authenticated: false }, now), false);
  // Missing access_expires_at
  assert.equal(accessTokenIsCurrent({ ...validStatus, access_expires_at: null }, now), false);
});

test("getStatus returns server-authoritative session status", async () => {
  const mockStatus: SessionStatus = {
    authenticated: true,
    inactivity_expires_at: "2026-10-30T12:00:00Z",
    absolute_expires_at: "2026-11-05T12:00:00Z",
    effective_expires_at: "2026-10-30T12:00:00Z",
    access_expires_at: "2026-10-29T12:15:00Z",
    server_time: "2026-10-29T12:00:00Z",
  };

  const client = new FellowSessionClient({
    fetcher: async (input) => {
      assert.ok(String(input).endsWith("/api/v1/auth/session"));
      return createMockResponse(mockStatus);
    },
    coordinator: new BrowserSessionCoordinator(),
  });

  const status = await client.getStatus();
  assert.deepEqual(status, mockStatus);
});

test("getStatus throws SessionNetworkError on fetch failure", async () => {
  const client = new FellowSessionClient({
    fetcher: async () => {
      throw new TypeError("Failed to fetch");
    },
    coordinator: new BrowserSessionCoordinator(),
  });

  await assert.rejects(
    async () => client.getStatus(),
    (err: unknown) => err instanceof SessionNetworkError
  );
});

test("renewAccess rotates tokens and completes session refresh", async () => {
  let refreshCalled = false;
  let statusCallCount = 0;
  const now = Date.parse("2026-10-29T12:00:00Z");

  const staleStatus: SessionStatus = {
    authenticated: true,
    inactivity_expires_at: "2026-10-30T12:00:00Z",
    absolute_expires_at: "2026-11-05T12:00:00Z",
    effective_expires_at: "2026-10-30T12:00:00Z",
    access_expires_at: new Date(now - 1000).toISOString(),
    server_time: new Date(now).toISOString(),
  };

  const freshStatus: SessionStatus = {
    ...staleStatus,
    access_expires_at: new Date(now + 15 * 60 * 1000).toISOString(),
  };

  const coordinator = new BrowserSessionCoordinator();
  const events: string[] = [];
  coordinator.subscribe((e) => events.push(e.type));

  const client = new FellowSessionClient({
    now: () => now,
    coordinator,
    fetcher: async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/session")) {
        statusCallCount += 1;
        return createMockResponse(refreshCalled ? freshStatus : staleStatus);
      }
      if (url.endsWith("/api/v1/auth/refresh")) {
        refreshCalled = true;
        return createMockResponse({ message: "Session refreshed successfully." });
      }
      throw new Error(`Unexpected URL: ${url}`);
    },
  });

  const success = await client.renewAccess();
  assert.equal(success, true);
  assert.equal(refreshCalled, true);
  assert.ok(statusCallCount >= 2);
  assert.ok(events.includes("refresh-start"));
  assert.ok(events.includes("refresh-complete"));
});

test("renewAccess coalesces concurrent calls within a tab to a single execution", async () => {
  let refreshCount = 0;
  const now = Date.parse("2026-10-29T12:00:00Z");

  const staleStatus: SessionStatus = {
    authenticated: true,
    inactivity_expires_at: "2026-10-30T12:00:00Z",
    absolute_expires_at: "2026-11-05T12:00:00Z",
    effective_expires_at: "2026-10-30T12:00:00Z",
    access_expires_at: new Date(now - 1000).toISOString(),
    server_time: new Date(now).toISOString(),
  };

  const freshStatus: SessionStatus = {
    ...staleStatus,
    access_expires_at: new Date(now + 900000).toISOString(),
  };

  const client = new FellowSessionClient({
    now: () => now,
    coordinator: new BrowserSessionCoordinator(),
    fetcher: async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/session")) {
        return createMockResponse(refreshCount > 0 ? freshStatus : staleStatus);
      }
      if (url.endsWith("/api/v1/auth/refresh")) {
        refreshCount += 1;
        await new Promise((r) => setTimeout(r, 20));
        return createMockResponse({ message: "Refreshed" });
      }
      throw new Error(`Unexpected URL: ${url}`);
    },
  });

  // Call renewAccess 3 times concurrently
  const [res1, res2, res3] = await Promise.all([
    client.renewAccess(),
    client.renewAccess(),
    client.renewAccess(),
  ]);

  assert.equal(res1, true);
  assert.equal(res2, true);
  assert.equal(res3, true);
  assert.equal(refreshCount, 1); // Refresh was called only once!
});

test("renewAccess handles HTTP 409 conflict and recovers using winning token", async () => {
  let refreshAttempted = false;
  const now = Date.parse("2026-10-29T12:00:00Z");

  const staleStatus: SessionStatus = {
    authenticated: true,
    inactivity_expires_at: "2026-10-30T12:00:00Z",
    absolute_expires_at: "2026-11-05T12:00:00Z",
    effective_expires_at: "2026-10-30T12:00:00Z",
    access_expires_at: new Date(now - 1000).toISOString(),
    server_time: new Date(now).toISOString(),
  };

  const winningStatus: SessionStatus = {
    ...staleStatus,
    access_expires_at: new Date(now + 900000).toISOString(),
  };

  const client = new FellowSessionClient({
    now: () => now,
    sleep: async () => {}, // Instant sleep for tests
    coordinator: new BrowserSessionCoordinator(),
    fetcher: async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/session")) {
        return createMockResponse(refreshAttempted ? winningStatus : staleStatus);
      }
      if (url.endsWith("/api/v1/auth/refresh")) {
        refreshAttempted = true;
        // Return 409 conflict
        return createMockResponse(
          { detail: "A concurrent request already refreshed this session." },
          409
        );
      }
      throw new Error(`Unexpected: ${url}`);
    },
  });

  const result = await client.renewAccess();
  assert.equal(result, true);
});

test("renewAccess publishes session-expired on 401 refresh rejection", async () => {
  const coordinator = new BrowserSessionCoordinator();
  const events: string[] = [];
  coordinator.subscribe((e) => events.push(e.type));

  const client = new FellowSessionClient({
    coordinator,
    fetcher: async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/session")) {
        return createMockResponse({
          authenticated: true,
          access_expires_at: "2020-01-01T00:00:00Z",
        });
      }
      if (url.endsWith("/api/v1/auth/refresh")) {
        return createMockResponse({ detail: "Session expired." }, 401);
      }
      throw new Error(`Unexpected URL: ${url}`);
    },
  });

  const success = await client.renewAccess();
  assert.equal(success, false);
  assert.ok(events.includes("session-expired"));
});

test("recordActivity renews access on 401 and successfully updates activity", async () => {
  let activityAttempt = 0;
  let refreshCalled = false;
  const now = Date.parse("2026-10-29T12:00:00Z");

  const activitySuccess: SessionActivity = {
    inactivity_expires_at: new Date(now + 24 * 3600 * 1000).toISOString(),
    absolute_expires_at: new Date(now + 7 * 24 * 3600 * 1000).toISOString(),
    effective_expires_at: new Date(now + 24 * 3600 * 1000).toISOString(),
    server_time: new Date(now).toISOString(),
  };

  const client = new FellowSessionClient({
    now: () => now,
    coordinator: new BrowserSessionCoordinator(),
    fetcher: async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/activity")) {
        activityAttempt += 1;
        if (activityAttempt === 1) {
          return createMockResponse({ detail: "Token expired" }, 401);
        }
        return createMockResponse(activitySuccess, 200);
      }
      if (url.endsWith("/api/v1/auth/refresh")) {
        refreshCalled = true;
        return createMockResponse({ message: "Refreshed" }, 200);
      }
      if (url.endsWith("/api/v1/auth/session")) {
        return createMockResponse({
          authenticated: true,
          access_expires_at: new Date(now + (refreshCalled ? 900000 : -1000)).toISOString(),
          inactivity_expires_at: "2026-10-30T12:00:00Z",
          absolute_expires_at: "2026-11-05T12:00:00Z",
          effective_expires_at: "2026-10-30T12:00:00Z",
          server_time: new Date(now).toISOString(),
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    },
  });

  const result = await client.recordActivity();
  assert.ok(result);
  assert.equal(refreshCalled, true);
  assert.equal(activityAttempt, 2);
  assert.deepEqual(result, activitySuccess);
});

