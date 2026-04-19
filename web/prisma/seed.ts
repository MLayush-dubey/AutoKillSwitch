import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@autokillswitch.in";
const DEMO_PASSWORD = "demo1234";

type TriggerSeed = {
  daysAgo: number;
  hour: number;
  minute: number;
  reason: "MAX_LOSS" | "MAX_PROFIT" | "MAX_TRADES" | "TIME_BASED";
  pnl: number;
  trades: number;
  cancelled: number;
  flattened: number;
};

const triggers: TriggerSeed[] = [
  { daysAgo: 2,  hour: 11, minute: 15, reason: "MAX_PROFIT", pnl: 10_100, trades: 14, cancelled: 2, flattened: 1 },
  { daysAgo: 5,  hour: 10, minute: 42, reason: "MAX_LOSS",   pnl: -5_050, trades: 8,  cancelled: 3, flattened: 2 },
  { daysAgo: 8,  hour: 13, minute: 58, reason: "MAX_TRADES", pnl: 1_280,  trades: 20, cancelled: 1, flattened: 0 },
  { daysAgo: 12, hour: 14, minute: 5,  reason: "TIME_BASED", pnl: -1_120, trades: 11, cancelled: 2, flattened: 1 },
  { daysAgo: 16, hour: 11, minute: 33, reason: "MAX_LOSS",   pnl: -5_210, trades: 6,  cancelled: 2, flattened: 1 },
  { daysAgo: 21, hour: 12, minute: 18, reason: "MAX_PROFIT", pnl: 10_450, trades: 12, cancelled: 1, flattened: 1 },
];

function buildEvents(t: TriggerSeed) {
  const base = `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
  const reasonText = {
    MAX_LOSS: `P&L hit max-loss limit ₹${Math.abs(t.pnl)}`,
    MAX_PROFIT: `P&L hit max-profit limit ₹${Math.abs(t.pnl)}`,
    MAX_TRADES: `Trade count reached max (${t.trades})`,
    TIME_BASED: `Time-based exit triggered at ${base}`,
  }[t.reason];

  return [
    { t: "09:15:00", kind: "info", msg: "Monitor started" },
    { t: base, kind: "trigger", msg: reasonText },
    { t: base, kind: "action", msg: `Cancelled ${t.cancelled} pending orders` },
    { t: base, kind: "action", msg: `Flattened ${t.flattened} position(s)` },
    { t: base, kind: "action", msg: "Kill switch activated — trading blocked for the day" },
  ];
}

async function main() {
  console.log("Seeding demo data…");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const demo = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: "Arvind Kumar",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  await prisma.rules.upsert({
    where: { userId: demo.id },
    update: {},
    create: {
      userId: demo.id,
      maxDailyLoss: 5000,
      maxDailyProfit: 10000,
      maxTrades: 20,
      warningThresholdPct: 80,
    },
  });

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setFullYear(now.getFullYear() + 1);

  await prisma.subscription.upsert({
    where: { userId: demo.id },
    update: {},
    create: {
      userId: demo.id,
      plan: "ANNUAL",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  const tokenExpiry = new Date(now.getTime() + 18 * 60 * 60 * 1000);
  await prisma.brokerConnection.upsert({
    where: { userId: demo.id },
    update: {},
    create: {
      userId: demo.id,
      broker: "dhan",
      clientId: "1102***8188",
      tokenExpiresAt: tokenExpiry,
      staticIp: "91.108.xxx.xxx",
      isActive: true,
      lastCheckedAt: now,
    },
  });

  // Clear prior demo triggers to keep seed idempotent.
  await prisma.trigger.deleteMany({ where: { userId: demo.id } });

  for (const t of triggers) {
    const triggeredAt = new Date(now);
    triggeredAt.setDate(now.getDate() - t.daysAgo);
    triggeredAt.setHours(t.hour, t.minute, 0, 0);

    await prisma.trigger.create({
      data: {
        userId: demo.id,
        triggeredAt,
        reason: t.reason,
        pnlAtTrigger: t.pnl,
        tradeCountAtTrigger: t.trades,
        ordersCancelled: t.cancelled,
        positionsFlattened: t.flattened,
        eventsJson: JSON.stringify(buildEvents(t)),
      },
    });
  }

  console.log(`\nDemo user seeded.`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Triggers: ${triggers.length}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
