# Mentor Portal: Cloudflare preparation

Use the existing Fellow/Admin Vinext and Cloudflare Workers architecture.
These settings prepare a separate Mentor Worker. Deployment and domain setup
require the next approved step.

| Cloudflare setting | Value |
| --- | --- |
| GitHub repository | `admindlif/degreelabs-dlif-platform-frontend` |
| Root / application directory | `apps/mentor-web` |
| Dependency installation | `npm ci` |
| Node.js | 24 (validated locally) |
| Worker name | `degreelabs-dlif-platform-frontend-mentor` |
| Build command | `npm run build:vinext` |
| Deploy command (future approved step only) | `npm run deploy:vinext -- --skip-build` |
| Custom domain (future approved step only) | `mentor.degreelabs.com` |
| Public build environment variable | `NEXT_PUBLIC_API_URL` |

`cloudflare.config.ts` uses `vinext/server/fetch-handler`, `nodejs_compat`,
the `2026-10-02` compatibility date, and the same `ASSETS` / `IMAGES`
bindings as Fellow/Admin. `vite.config.ts` uses Vinext's image optimizer and
Cloudflare's `rsc` environment with `ssr` as its child environment.
`wrangler.jsonc` retains the matching Worker name and asset output paths.
No custom-domain route is registered by this preparation.

Vinext and `@vinext/cloudflare` are pinned to `1.0.1`, matching the Fellow/Admin
lockfiles. The previous Mentor lockfile resolved Vinext `1.3.1` and adapter
`1.2.1`, which required a newer React version and failed the Worker build.
React `19.2.8`, Next.js `16.3.6`, and all development scripts remain unchanged.

## Backend URL and authentication

Set `NEXT_PUBLIC_API_URL` in Cloudflare's **build environment** to the existing
deployed FastAPI HTTPS URL used by Fellow/Admin. A base origin or a URL ending
in `/api/v1` is supported. The real backend URL must be supplied by the project;
no production address is stored in source.

Public environment variables are embedded in the browser bundle at build time.
Changing a Worker runtime variable alone does not change an existing bundle:
rebuild with the correct value before using `--skip-build`.

The Vinext build rejects missing, HTTP, or localhost API configuration. The API
helper also rejects these values in production. Local development keeps the
existing legacy `NEXT_PUBLIC_API_BASE_URL` / `API_BASE_URL` fallback and port
3003; `.env.example` documents the preferred local `NEXT_PUBLIC_API_URL` setting.

API requests retain `credentials: "include"`. Before the later deployment,
verify the backend allows the exact `https://mentor.degreelabs.com` origin
with credentialed CORS, and its Secure/SameSite cookie configuration supports
requests from that origin. Verify login and 2FA against the actual backend after
deployment. No backend configuration is changed by this task.

Keep database, SMTP, Cloudflare token, and other private credentials out of
`NEXT_PUBLIC_*` variables and frontend source.

## Local validation

From this directory, with `NEXT_PUBLIC_API_URL` set in the shell:

```text
npx tsc --noEmit
npm run build
npm run build:vinext
```

A temporary `https://api.example.invalid` value can be used for compile-only
validation. It cannot serve API traffic and must never be used for deployment.
Rebuild with the real backend URL for deployment; local validation output is
not a production-ready artifact.

The deploy command and its `--skip-build` option are verified from the installed
Vinext Cloudflare CLI source. Do not run that command during preparation.

Validation completed on 28 October 2026:

- TypeScript: passed.
- Next.js production build: passed (network access needed for existing Google Fonts).
- Vinext production build: passed; generated the Worker bundle and static assets.
- Generated Worker name, compatibility date/flags, and ASSETS/IMAGES bindings: verified.
- API URL checks: passed for browser/server parity, development compatibility,
  and rejection of missing or localhost production configuration.
- Generated client API helper contains the temporary validation URL with no
  localhost API fallback.

Vinext emits non-blocking plugin source-map, chunking, and static route
classification warnings. These did not fail the build. Authentication and live
API connectivity still require verification with the real backend and domain.

## Remaining setup

Supply the real public API URL and verify backend CORS/cookie compatibility.
The Mentor application is currently untracked in the working tree; a future
authorized commit/push must include it before Cloudflare can build it from GitHub.
After explicit approval, connect the separate Worker and add the custom domain
through the existing Cloudflare account. No commit, push, Worker deployment,
or DNS change is part of this preparation.
