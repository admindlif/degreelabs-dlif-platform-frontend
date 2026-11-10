import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const backendRoot = process.env.DLIF_BACKEND_ROOT ?? "D:\\degreelabs-dlif-platform-backend";
const apiUrl = "http://127.0.0.1:8001";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: ".venv\\Scripts\\python.exe scripts\\run_e2e_server.py",
      cwd: backendRoot,
      url: `${apiUrl}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1",
      cwd: path.join(process.cwd(), "apps", "student-web"),
      env: { NEXT_PUBLIC_API_URL: apiUrl },
      url: "http://127.0.0.1:3000/login",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1",
      cwd: path.join(process.cwd(), "apps", "admin-web"),
      env: { NEXT_PUBLIC_API_URL: apiUrl },
      url: "http://127.0.0.1:3002/login",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1",
      cwd: path.join(process.cwd(), "apps", "mentor-web"),
      env: { NEXT_PUBLIC_API_URL: apiUrl, NEXT_PUBLIC_API_BASE_URL: `${apiUrl}/api/v1` },
      url: "http://127.0.0.1:3003/login",
      reuseExistingServer: false,
      timeout: 120_000,
    }
  ],
});
