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

## Render configuration

### Fellow Portal

- Root Directory: `apps/student-web`
- Build Command: `npm ci && npm run build`
- Start Command: `npx next start --port $PORT`

### Admin Portal

- Root Directory: `apps/admin-web`
- Build Command: `npm ci && npm run build`
- Start Command: `npx next start --port $PORT`

The root Dockerfiles are available when deploying either application with
Render's Docker runtime.
