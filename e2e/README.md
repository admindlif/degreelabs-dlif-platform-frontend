# Cross-portal authentication E2E tests

These Playwright tests start the three local portal origins and FastAPI on
`127.0.0.1`. The backend helper derives a dedicated PostgreSQL database whose
name must end in `_e2e_test`; it refuses remote database hosts.

Run from the nested frontend repository:

```powershell
npm install
npx playwright install chromium
npm run test:e2e
```

The fixed accounts, passwords, TOTP seeds, reset code, and recovery code are
local test fixtures only. The test suite resets them before every scenario.
Production-equivalent `Secure`, SameSite, Cloudflare, and HTTPS behavior still
requires an isolated HTTPS staging run and must not be inferred from localhost.
