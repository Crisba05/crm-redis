# Deployment Guide

## Strategy
This system deploys a daemon container meant to be kept actively running in the background. It is managed by Dokploy.

## Dockerfile Design
Follows a standard multi-stage build pattern:
1. **Builder Stage (`node:20-alpine`)**: Installs all dependencies via `npm ci`, compiles TypeScript (`npm run build`).
2. **Production Stage (`node:20-alpine`)**: Copies `package.json`, installs only production dependencies (`npm ci --omit=dev`), and brings over the compiled `/dist` directory. Starts the runner with `npm start`.

## Infrastructure Configuration
This service **must** have access to the exact same Redis URL connection string as `crm-backend`.

## Environment Variables
The application consumes typical Node environment variables:
- `NODE_ENV`: Enforced to `production` in the Dockerfile.
- `REDIS_URL`: The Redis connection string `<YOUR_REDIS_URL>`.
- Other variables dependent on `config/`: SMTP credentials (for Nodemailer) or Resend keys as requested.

## Healthchecks
Workers typically don't expose HTTP ports (no Express/NestJS configuration detected). For Dokploy, ensure the healthcheck mechanism is turned **OFF** for HTTP endpoints, or configure it to run a simple CLI script if necessary, otherwise Dokploy will think the service is failing and restart it in an infinite loop.
