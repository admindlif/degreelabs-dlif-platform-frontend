import { execFileSync } from "node:child_process";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

export const API_URL = "http://127.0.0.1:8001";
export const FELLOW_URL = "http://127.0.0.1:3000";
export const ADMIN_URL = "http://127.0.0.1:3002";
export const MENTOR_URL = "http://127.0.0.1:3003";
export const PASSWORD = "E2e-Local-Password-123!";
export const RESET_PASSWORD = "E2e-Reset-Password-456!";
export const RESET_CODE = "24681357";
export const RECOVERY_CODE = "fellow-e2e-code";
export const EMAIL = {
  fellow: "fellow.e2e@example.com",
  mentor: "mentor.e2e@example.com",
  admin: "admin.e2e@example.com",
  superAdmin: "superadmin.e2e@example.com",
  manager: "manager.e2e@example.com",
} as const;

const backendRoot = process.env.DLIF_BACKEND_ROOT ?? "D:\\degreelabs-dlif-platform-backend";
const python = path.join(backendRoot, ".venv", "Scripts", "python.exe");
const fixtureScript = path.join(backendRoot, "scripts", "e2e_auth_fixture.py");

export function fixture(...args: string[]): string {
  return execFileSync(python, [fixtureScript, ...args], {
    cwd: backendRoot,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

export function resetFixtures(): void {
  fixture("seed");
}

export async function browserApi<T = Record<string, unknown>>(
  page: Page,
  method: string,
  route: string,
  body?: unknown
): Promise<{ status: number; data: T }> {
  return page.evaluate(
    async ({ apiUrl, methodName, routeName, requestBody }) => {
      const response = await fetch(`${apiUrl}${routeName}`, {
        method: methodName,
        credentials: "include",
        cache: "no-store",
        headers: requestBody === undefined ? undefined : { "Content-Type": "application/json" },
        body: requestBody === undefined ? undefined : JSON.stringify(requestBody),
      });
      return { status: response.status, data: await response.json().catch(() => ({})) };
    },
    { apiUrl: API_URL, methodName: method, routeName: route, requestBody: body }
  ) as Promise<{ status: number; data: T }>;
}

export async function loginWithTotp(page: Page, portalUrl: string, email: string): Promise<void> {
  await page.goto(`${portalUrl}/login`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText(/Two-Factor Verification/i)).toBeVisible();
  const code = fixture("totp", email);
  await page.locator('input[autocomplete="one-time-code"]').fill(code);
  await page.locator('button[type="submit"]').click();
  await expect.poll(async () => (await browserApi<{ authenticated: boolean }>(page, "GET", "/api/v1/auth/session")).data.authenticated).toBe(true);
}

export async function enrollPrivilegedMfa(
  page: Page,
  portalUrl: string,
  email: string
): Promise<void> {
  await page.goto(`${portalUrl}/login`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText(/Secure Your Account/i)).toBeVisible();
  const code = fixture("totp", email);
  await page.locator('input[autocomplete="one-time-code"]').fill(code);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText(/Save Recovery Codes/i)).toBeVisible();
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole("button", { name: /Continue to/i }).click();
  await expect.poll(async () => (await browserApi<{ authenticated: boolean }>(page, "GET", "/api/v1/auth/session")).data.authenticated).toBe(true);
}

export async function removeAccessCookie(page: Page): Promise<void> {
  const cookies = await page.context().cookies();
  await page.context().clearCookies();
  await page.context().addCookies(cookies.filter((cookie) => cookie.name !== "dlif_access"));
}
