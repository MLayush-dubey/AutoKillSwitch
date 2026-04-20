# AutoKillSwitch — Web

Next.js 15 + TypeScript + Tailwind v4 + shadcn/ui + Prisma + NextAuth v5.

## Local dev

```bash
cd web
npm install
cp .env.example .env.local
# edit AUTH_SECRET — any long random string
npm run db:push      # create SQLite schema
npm run db:seed      # seed demo user
npm run dev
```

Demo login: `demo@autokillswitch.in` / `demo1234`.

### OneDrive note

This repo lives inside a OneDrive-synced folder. OneDrive locks files under
`.next/` (particularly `trace`) while Next.js is compiling, which causes
`npm run dev` to hang at "Starting…". The npm scripts set
`NEXT_TELEMETRY_DISABLED=1` via `cross-env` to disable the trace file and
sidestep the conflict. If a stale `.next/` still causes hangs, delete it:

```bash
rm -rf .next && npm run dev
```

Promote the demo user (or any user) to admin to unlock `/app/admin`:

```bash
npx tsx --env-file=.env scripts/promote.ts demo@autokillswitch.in
```

## What's built (Weeks 1–4)

- **Week 1** — auth, Prisma schema, demo seed, layouts.
- **Week 2** — landing page, pricing, FAQ, legal pages, contact form.
- **Week 3** — dashboard overview, rules, history, broker, onboarding, settings.
- **Week 4** — billing + plan change (Razorpay mock), transactional emails
  (welcome, password reset, trigger alerts, weekly summary, plan change),
  admin panel, theme persistence (dark / light / system).

## Deployment (Vercel)

1. Push the `web/` folder as project root in Vercel (set **Root Directory**
   to `web`).
2. Swap `DATABASE_URL` to a Postgres provider (Railway, Neon, Supabase)
   and set `datasource db { provider = "postgresql" }` in
   `prisma/schema.prisma`, then `prisma migrate deploy` on first deploy.
3. Required env vars on Vercel:
   - `DATABASE_URL`
   - `AUTH_SECRET` (generate with `npx auth secret`)
   - `AUTH_URL` = your production URL
   - `NEXT_PUBLIC_APP_URL` = same URL (used inside email templates)
4. Optional env vars (features degrade gracefully when unset):
   - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Google OAuth
   - `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` — live email
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — live payments
5. Build command: `next build` (default). Install command: `npm install`.
