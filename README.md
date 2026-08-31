# AkiraMinaFit

A full-stack Persian RTL fitness coaching MVP packaged as a Vite+ monorepo and installable PWA.

## Included

- React, Tailwind CSS, shadcn-style components and Recharts
- Hono API on Node.js
- Better Auth with coach/student roles
- Drizzle ORM and PostgreSQL through `pg`
- S3-compatible image/video uploads with local MinIO
- Workout plan builder, weekday scheduling and immutable exercise snapshots
- Daily student workout Todo, actual completion records and offline mutation queue
- Body report history and progress charts

## Quick start

Requires Node.js 22.12+ and Docker.

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:push
# Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env first.
npm run db:seed
npm run dev
```

Web: `http://localhost:5173`  
API: `http://localhost:3000`  
MinIO console: `http://localhost:9001`

## Production start

Set the production domain in `.env`, including `NODE_ENV=production`, `WEB_ORIGIN` and
`BETTER_AUTH_URL`. Set `VITE_API_URL=` to serve both the web app and API from the same domain.
Then run:

```bash
npm run start
```

The command builds the web app, replaces `apps/api/public` with its output, builds the API and
starts it. Database migrations and Docker services are intentionally managed separately.

## Primary coach seed

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env`, then run `npm run db:seed`. The
command creates or updates that account with the `coach` role. It does not create students,
exercises, plans, workouts, or reports, and it never prints the password.

## Verification

```bash
npm run verify:structure
npm run typecheck
npm run build
```

For production, use a private media bucket, signed read URLs, video scanning/transcoding, HTTPS,
rate limiting and managed backups.
