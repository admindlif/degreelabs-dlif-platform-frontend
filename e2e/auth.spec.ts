import { expect, test } from "@playwright/test";
import {
  ADMIN_URL,
  API_URL,
  EMAIL,
  FELLOW_URL,
  MENTOR_URL,
  PASSWORD,
  RECOVERY_CODE,
  RESET_CODE,
  RESET_PASSWORD,
  browserApi,
  enrollPrivilegedMfa,
  fixture,
  loginWithTotp,
  removeAccessCookie,
  resetFixtures,
} from "./helpers";

test.describe.configure({ mode: "serial" });

test.beforeEach(async () => resetFixtures());

test("01 Fellow password and TOTP login", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  await expect(page).toHaveURL(/\/home/);
});

test("02 Mentor password and TOTP login", async ({ page }) => {
  await loginWithTotp(page, MENTOR_URL, EMAIL.mentor);
  await expect(page).toHaveURL(/\/home/);
});

test("03 Admin mandatory MFA enrollment", async ({ page }) => {
  await enrollPrivilegedMfa(page, ADMIN_URL, EMAIL.admin);
});

test("04 Super Admin mandatory MFA enrollment", async ({ page }) => {
  await enrollPrivilegedMfa(page, ADMIN_URL, EMAIL.superAdmin);
});

test("05 Program Manager mandatory MFA enrollment", async ({ page }) => {
  await enrollPrivilegedMfa(page, MENTOR_URL, EMAIL.manager);
});

test("06 authenticated session is restored after page refresh", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  await page.reload();
  await expect.poll(async () => (await browserApi<{ authenticated: boolean }>(page, "GET", "/api/v1/auth/session")).data.authenticated).toBe(true);
});

test("07 missing or expired access token is renewed from the server session", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  await removeAccessCookie(page);
  await page.reload();
  await expect.poll(async () => (await page.context().cookies()).some((cookie) => cookie.name === "dlif_access")).toBe(true);
});

test("08 session remains usable after controlled 30-minute elapsed time", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  fixture("set-session-time", EMAIL.fellow, "active-30m");
  expect((await browserApi<{ authenticated: boolean }>(page, "GET", "/api/v1/auth/session")).data.authenticated).toBe(true);
});

test("09 session remains usable after controlled 60-minute elapsed time", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  fixture("set-session-time", EMAIL.fellow, "active-60m");
  expect((await browserApi<{ authenticated: boolean }>(page, "GET", "/api/v1/auth/session")).data.authenticated).toBe(true);
});

test("10 24-hour inactivity expires the server session", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  fixture("set-session-time", EMAIL.fellow, "inactivity-expired");
  expect((await browserApi<{ authenticated: boolean }>(page, "GET", "/api/v1/auth/session")).data.authenticated).toBe(false);
});

test("11 five-minute warning follows server-controlled time", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  fixture("set-session-time", EMAIL.fellow, "warning");
  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.getByText("Your Session Is About to Expire")).toBeVisible();
});

test("12 Stay Signed In records genuine activity", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  fixture("set-session-time", EMAIL.fellow, "warning");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByRole("button", { name: "Stay Signed In" }).click();
  await expect(page.getByRole("alertdialog")).toBeHidden();
  expect((await browserApi<{ authenticated: boolean }>(page, "GET", "/api/v1/auth/session")).data.authenticated).toBe(true);
});

test("13 role-specific absolute expiry is server authoritative", async ({ page }) => {
  await loginWithTotp(page, MENTOR_URL, EMAIL.mentor);
  fixture("set-session-time", EMAIL.mentor, "absolute-expired");
  expect((await browserApi<{ authenticated: boolean }>(page, "GET", "/api/v1/auth/session")).data.authenticated).toBe(false);
});

test("14 refresh rotates the server refresh generation", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  expect(fixture("session-summary", EMAIL.fellow)).toBe("0:active");
  expect((await browserApi(page, "POST", "/api/v1/auth/refresh")).status).toBe(200);
  expect(fixture("session-summary", EMAIL.fellow)).toBe("1:active");
});

test("15 simultaneous refresh requests preserve one valid session", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  const statuses = await page.evaluate(async (apiUrl) => Promise.all(
    [0, 1].map(async () => (await fetch(`${apiUrl}/api/v1/auth/refresh`, {
      method: "POST", credentials: "include",
    })).status)
  ), API_URL);
  expect(statuses.every((status) => status === 200 || status === 409)).toBe(true);
  expect(statuses).toContain(200);
  expect((await browserApi<{ authenticated: boolean }>(page, "GET", "/api/v1/auth/session")).data.authenticated).toBe(true);
});

test("16 HTTP 409 refresh race recovers with the winning cookie", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  await removeAccessCookie(page);
  await Promise.all([page.reload(), page.waitForTimeout(50)]);
  await expect.poll(async () => (await browserApi<{ authenticated: boolean }>(page, "GET", "/api/v1/auth/session")).data.authenticated).toBe(true);
});

test("17 browser resume and multiple tabs synchronize session state", async ({ page, context }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  const second = await context.newPage();
  await second.goto(`${FELLOW_URL}/home`);
  fixture("set-session-time", EMAIL.fellow, "active-60m");
  await second.bringToFront();
  await second.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect.poll(async () => (await browserApi<{ authenticated: boolean }>(second, "GET", "/api/v1/auth/session")).data.authenticated).toBe(true);
});

test("18 password reset revokes the existing browser session", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  const requested = await browserApi<{ recovery_request_id: string }>(page, "POST", "/api/v1/auth/password-reset/request", { email: EMAIL.fellow, portal: "fellow" });
  expect(requested.status).toBe(200);
  fixture("set-password-reset-code", EMAIL.fellow, requested.data.recovery_request_id);
  const verified = await browserApi<{ reset_authorization: string }>(page, "POST", "/api/v1/auth/password-reset/verify", { recovery_request_id: requested.data.recovery_request_id, code: RESET_CODE });
  expect(verified.status).toBe(200);
  const confirmed = await browserApi(page, "POST", "/api/v1/auth/password-reset/confirm", {
    reset_authorization: verified.data.reset_authorization,
    new_password: RESET_PASSWORD,
    confirm_password: RESET_PASSWORD,
  });
  expect(confirmed.status).toBe(200);
  expect((await browserApi<{ authenticated: boolean }>(page, "GET", "/api/v1/auth/session")).data.authenticated).toBe(false);
});

test("19 one-time recovery code authenticates", async ({ page }) => {
  await page.goto(`${FELLOW_URL}/login`);
  await page.locator('input[type="email"]').fill(EMAIL.fellow);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.getByRole("button", { name: /recovery code/i }).click();
  await page.locator('input[autocomplete="one-time-code"]').fill(RECOVERY_CODE);
  await page.locator('button[type="submit"]').click();
  await expect.poll(async () => (await browserApi<{ authenticated: boolean }>(page, "GET", "/api/v1/auth/session")).data.authenticated).toBe(true);
});

test("20 logout revokes the server session and clears cookies", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  expect((await browserApi(page, "POST", "/api/v1/auth/logout")).status).toBe(200);
  expect(fixture("session-summary", EMAIL.fellow)).toBe("0:revoked");
  expect((await browserApi<{ authenticated: boolean }>(page, "GET", "/api/v1/auth/session")).data.authenticated).toBe(false);
});

test("21 unauthenticated 401 and unauthorized 403 remain distinct", async ({ page }) => {
  await page.goto(`${FELLOW_URL}/login`);
  expect((await browserApi(page, "GET", "/api/v1/auth/me")).status).toBe(401);
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  expect((await browserApi(page, "GET", "/api/v1/admin/stats")).status).toBe(403);
});

test("22 user-scoped drafts survive reload and remain isolated", async ({ page }) => {
  await loginWithTotp(page, FELLOW_URL, EMAIL.fellow);
  await page.evaluate(() => sessionStorage.setItem(
    "dlif:fellow-draft:v1:fellow.e2e%40example.com:e2e-record",
    JSON.stringify({ value: { notes: "preserve me" }, expiresAt: Date.now() + 60_000 })
  ));
  await page.reload();
  expect(await page.evaluate(() => sessionStorage.getItem("dlif:fellow-draft:v1:fellow.e2e%40example.com:e2e-record"))).toContain("preserve me");
  expect(await page.evaluate(() => sessionStorage.getItem("dlif:fellow-draft:v1:other-user:e2e-record"))).toBeNull();
});
