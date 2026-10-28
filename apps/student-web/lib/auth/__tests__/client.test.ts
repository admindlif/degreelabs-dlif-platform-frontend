import test from "node:test";
import assert from "node:assert/strict";
import { apiClient, ApiError } from "../../api/client.ts";
import { fellowSessionClient, SessionNetworkError } from "../session-client.ts";

function createMockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("apiClient successfully retries GET on 401 after access renewal", async () => {
  let callCount = 0;
  const originalFetch = globalThis.fetch;
  const originalRenew = fellowSessionClient.renewAccess;

  fellowSessionClient.renewAccess = async () => true;

  globalThis.fetch = async () => {
    callCount += 1;
    if (callCount === 1) {
      return createMockResponse({ detail: "Token expired" }, 401);
    }
    return createMockResponse({ data: "success" }, 200);
  };

  try {
    const result = await apiClient<{ data: string }>("/test-endpoint", {
      method: "GET",
    });
    assert.deepEqual(result, { data: "success" });
    assert.equal(callCount, 2);
  } finally {
    globalThis.fetch = originalFetch;
    fellowSessionClient.renewAccess = originalRenew;
  }
});

test("apiClient does not blindly retry POST on 401 but informs user of renewal", async () => {
  let callCount = 0;
  const originalFetch = globalThis.fetch;
  const originalRenew = fellowSessionClient.renewAccess;

  fellowSessionClient.renewAccess = async () => true;

  globalThis.fetch = async () => {
    callCount += 1;
    return createMockResponse({ detail: "Token expired" }, 401);
  };

  try {
    await assert.rejects(
      async () =>
        apiClient("/submit-work", {
          method: "POST",
          body: JSON.stringify({ reflection: "test" }),
        }),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 401);
        assert.match(err.message, /Your session was renewed\. Please submit this action again\./);
        return true;
      }
    );
    // POST was NOT retried automatically to prevent duplicate side effects
    assert.equal(callCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
    fellowSessionClient.renewAccess = originalRenew;
  }
});

test("apiClient throws session expired when renewal returns false", async () => {
  const originalFetch = globalThis.fetch;
  const originalRenew = fellowSessionClient.renewAccess;

  fellowSessionClient.renewAccess = async () => false;

  globalThis.fetch = async () => {
    return createMockResponse({ detail: "Session expired" }, 401);
  };

  try {
    await assert.rejects(
      async () => apiClient("/profile", { method: "GET" }),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 401);
        assert.match(err.message, /Your session has expired/);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
    fellowSessionClient.renewAccess = originalRenew;
  }
});

test("apiClient distinguishes 403 permission errors from session expiration", async () => {
  const originalFetch = globalThis.fetch;
  const originalRenew = fellowSessionClient.renewAccess;
  let renewCalled = false;

  fellowSessionClient.renewAccess = async () => {
    renewCalled = true;
    return true;
  };

  globalThis.fetch = async () => {
    return createMockResponse(
      { detail: "Access denied: Fellow role required." },
      403
    );
  };

  try {
    await assert.rejects(
      async () => apiClient("/admin-resource", { method: "GET" }),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 403);
        assert.match(err.message, /Access denied/);
        return true;
      }
    );
    // 403 does not trigger token renewal!
    assert.equal(renewCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
    fellowSessionClient.renewAccess = originalRenew;
  }
});

test("apiClient throws status 0 ApiError on renewal network error without discarding work", async () => {
  const originalFetch = globalThis.fetch;
  const originalRenew = fellowSessionClient.renewAccess;

  fellowSessionClient.renewAccess = async () => {
    throw new SessionNetworkError("Network unreachable");
  };

  globalThis.fetch = async () => {
    return createMockResponse({ detail: "Token expired" }, 401);
  };

  try {
    await assert.rejects(
      async () => apiClient("/profile", { method: "GET" }),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.match(err.message, /temporarily unavailable/);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
    fellowSessionClient.renewAccess = originalRenew;
  }
});

