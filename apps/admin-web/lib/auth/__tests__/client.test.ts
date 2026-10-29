import test from "node:test";
import assert from "node:assert/strict";
import { adminApiClient, ApiError } from "../../api/client.ts";
import { adminSessionClient, SessionNetworkError } from "../session-client.ts";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

test("Admin GET retries once after access renewal", async () => {
  let calls = 0;
  const originalFetch = globalThis.fetch;
  const originalRenew = adminSessionClient.renewAccess;
  adminSessionClient.renewAccess = async () => true;
  globalThis.fetch = async () => ++calls === 1 ? response({ detail: "expired" }, 401) : response({ ok: true });
  try {
    assert.deepEqual(await adminApiClient("/test"), { ok: true });
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    adminSessionClient.renewAccess = originalRenew;
  }
});

test("Admin POST is never replayed automatically", async () => {
  let calls = 0;
  const originalFetch = globalThis.fetch;
  const originalRenew = adminSessionClient.renewAccess;
  adminSessionClient.renewAccess = async () => true;
  globalThis.fetch = async () => { calls += 1; return response({ detail: "expired" }, 401); };
  try {
    await assert.rejects(
      () => adminApiClient("/change", { method: "POST", body: "{}" }),
      (error: unknown) => error instanceof ApiError && error.status === 401 && /submit this action again/i.test(error.message)
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    adminSessionClient.renewAccess = originalRenew;
  }
});

test("Admin 403 remains an authorization error and does not refresh", async () => {
  let renewed = false;
  const originalFetch = globalThis.fetch;
  const originalRenew = adminSessionClient.renewAccess;
  adminSessionClient.renewAccess = async () => { renewed = true; return true; };
  globalThis.fetch = async () => response({ detail: "Administrator role required." }, 403);
  try {
    await assert.rejects(
      () => adminApiClient("/restricted"),
      (error: unknown) => error instanceof ApiError && error.status === 403 && /Administrator role required/.test(error.message)
    );
    assert.equal(renewed, false);
  } finally {
    globalThis.fetch = originalFetch;
    adminSessionClient.renewAccess = originalRenew;
  }
});

test("Admin renewal network errors preserve work with status zero", async () => {
  const originalFetch = globalThis.fetch;
  const originalRenew = adminSessionClient.renewAccess;
  adminSessionClient.renewAccess = async () => { throw new SessionNetworkError("offline"); };
  globalThis.fetch = async () => response({ detail: "expired" }, 401);
  try {
    await assert.rejects(
      () => adminApiClient("/profile"),
      (error: unknown) => error instanceof ApiError && error.status === 0 && /temporarily unavailable/i.test(error.message)
    );
  } finally {
    globalThis.fetch = originalFetch;
    adminSessionClient.renewAccess = originalRenew;
  }
});
