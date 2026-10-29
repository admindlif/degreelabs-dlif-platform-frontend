import test from "node:test";
import assert from "node:assert/strict";
import {
  accessTokenIsCurrent,
  AdminSessionClient,
  SessionNetworkError,
  type SessionStatus,
} from "../session-client.ts";
import { BrowserSessionCoordinator } from "../session-coordinator.ts";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const now = Date.parse("2026-10-29T12:00:00Z");
const stale: SessionStatus = {
  authenticated: true,
  inactivity_expires_at: "2026-10-30T12:00:00Z",
  absolute_expires_at: "2026-10-30T12:00:00Z",
  effective_expires_at: "2026-10-30T12:00:00Z",
  access_expires_at: new Date(now - 1_000).toISOString(),
  server_time: new Date(now).toISOString(),
};
const fresh = { ...stale, access_expires_at: new Date(now + 15 * 60 * 1_000).toISOString() };

test("access token freshness includes clock skew", () => {
  assert.equal(accessTokenIsCurrent(fresh, now), true);
  assert.equal(accessTokenIsCurrent({ ...fresh, access_expires_at: new Date(now + 4_000).toISOString() }, now), false);
});

test("concurrent refresh calls are coalesced", async () => {
  let refreshes = 0;
  const client = new AdminSessionClient({
    now: () => now,
    coordinator: new BrowserSessionCoordinator(),
    fetcher: async (input) => {
      const url = String(input);
      if (url.endsWith("/session")) return response(refreshes ? fresh : stale);
      if (url.endsWith("/refresh")) { refreshes += 1; await new Promise((resolve) => setTimeout(resolve, 10)); return response({ message: "ok" }); }
      throw new Error(`Unexpected URL: ${url}`);
    },
  });
  assert.deepEqual(await Promise.all([client.renewAccess(), client.renewAccess(), client.renewAccess()]), [true, true, true]);
  assert.equal(refreshes, 1);
});

test("a 409 refresh race accepts the winning cookie", async () => {
  let attempted = false;
  const client = new AdminSessionClient({
    now: () => now,
    sleep: async () => {},
    coordinator: new BrowserSessionCoordinator(),
    fetcher: async (input) => {
      const url = String(input);
      if (url.endsWith("/session")) return response(attempted ? fresh : stale);
      if (url.endsWith("/refresh")) { attempted = true; return response({ detail: "race" }, 409); }
      throw new Error(`Unexpected URL: ${url}`);
    },
  });
  assert.equal(await client.renewAccess(), true);
});

test("network failure is distinct from session expiry", async () => {
  const client = new AdminSessionClient({
    coordinator: new BrowserSessionCoordinator(),
    fetcher: async () => { throw new TypeError("offline"); },
  });
  await assert.rejects(() => client.getStatus(), (error: unknown) => error instanceof SessionNetworkError);
});
