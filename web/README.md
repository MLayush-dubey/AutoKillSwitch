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

## Week 1 scope

Foundation only. Marketing pages, dashboard widgets, billing, and broker
connection UI are placeholders and land in Weeks 2–4. See `../frontend-plan.md`.
