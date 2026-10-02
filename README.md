# DegreeLabs DLIF Platform Frontend

This repository contains the active frontend applications for the DegreeLabs
Impact Fellowship platform.

## Applications

- `apps/student-web`: Fellow Portal
- `apps/admin-web`: Admin Portal

Both applications require the public build-time environment variable:

```text
NEXT_PUBLIC_API_URL=https://your-api-domain.example
```

## Fellow Portal on Cloudflare Workers

- Root Directory: `apps/student-web`
- Build Command: `npm run build:vinext`
- Deploy Command: `npm run deploy:vinext -- --skip-build`

The Worker name is defined in `cloudflare.config.ts`. The Fellow Portal uses
a single Worker and does not require a separately deployed cache Worker.

## Admin Portal on Render

- Root Directory: `apps/admin-web`
- Build Command: `npm ci && npm run build`
- Start Command: `npx next start --port $PORT`

The root Dockerfiles are available when deploying either application with
Render's Docker runtime.
