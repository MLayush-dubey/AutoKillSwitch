import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { defaultRules } from "@/lib/rules";
import { formatINR } from "@/lib/utils";
import { LiveStatusCards } from "./(dashboard-parts)/live-status";
import { PnlChart, type DailyPnl } from "./(dashboard-parts)/pnl-chart";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, rules, triggers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardedAt: true },
    }),
    prisma.rules.findUnique({ where: { userId: session.user.id } }),
    prisma.trigger.findMany({
      where: { userId: session.user.id },
      orderBy: { triggeredAt: "desc" },
      take: 30,
      select: {
        triggeredAt: true,
        pnlAtTrigger: true,
      },
    }),
  ]);

  const r = rules ?? defaultRules;
  const chart = buildSevenDayChart(triggers);
  const todayActivity = buildTodayActivity(triggers[0]);
  const needsOnboarding = !user?.onboardedAt;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Your trading discipline, visualized.
          </p>
        </div>
      </div>

      {needsOnboarding && (
        <div className="flex flex-col gap-3 rounded-lg border border-[color:var(--brand-gold)]/50 bg-[color:var(--brand-gold)]/5 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-[color:var(--brand-gold)]" />
            <div>
              <div className="text-sm font-medium">Finish setting up</div>
              <div className="text-xs text-muted-foreground">
                Connect your Dhan account to start monitoring.
              </div>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/app/onboarding">Continue setup</Link>
          </Button>
        </div>
      )}

      <LiveStatusCards
        maxDailyLoss={r.maxDailyLoss}
        maxDailyProfit={r.maxDailyProfit}
        maxTrades={r.maxTrades}
        seedPnl={2450}
        seedTrades={14}
      />

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s activity</CardTitle>
          <CardDescription>Events in IST, newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-3 border-l border-border pl-6">
            {todayActivity.map((ev, i) => (
              <li key={i} className="relative">
                <span
                  className={`absolute -left-[27px] top-1.5 h-2 w-2 rounded-full ${
                    ev.kind === "trigger"
                      ? "bg-[color:var(--loss)]"
                      : ev.kind === "warning"
                        ? "bg-[color:var(--brand-gold)]"
                        : ev.kind === "action"
                          ? "bg-[color:var(--brand-emerald)]"
                          : "bg-muted-foreground"
                  }`}
                />
                <div className="flex items-baseline gap-3 text-sm">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {ev.time}
                  </span>
                  <span>{ev.msg}</span>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Last 7 days</CardTitle>
            <CardDescription>
              Daily P&amp;L. Gold lines mark killswitch triggers.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">
              7d sum:{" "}
              <span
                className={
                  sumOf(chart) >= 0
                    ? "text-[color:var(--profit)]"
                    : "text-[color:var(--loss)]"
                }
              >
                {sumOf(chart) >= 0 ? "+" : ""}
                {formatINR(sumOf(chart))}
              </span>
            </span>
            <Zap className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <PnlChart data={chart} />
        </CardContent>
      </Card>
    </div>
  );
}

function sumOf(chart: DailyPnl[]) {
  return chart.reduce((s, d) => s + d.pnl, 0);
}

function buildSevenDayChart(
  triggers: { triggeredAt: Date; pnlAtTrigger: number }[]
): DailyPnl[] {
  const triggerByDay = new Map<string, number>();
  for (const t of triggers) {
    const key = t.triggeredAt.toISOString().slice(0, 10);
    triggerByDay.set(key, t.pnlAtTrigger);
  }

  const out: DailyPnl[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const triggeredPnl = triggerByDay.get(iso);
    const triggered = triggeredPnl !== undefined;
    // Deterministic-ish daily P&L based on date hash so chart is stable.
    const hash =
      (d.getUTCFullYear() * 73 + (d.getUTCMonth() + 1) * 31 + d.getUTCDate()) %
      1000;
    const synthetic = Math.round(((hash - 500) / 500) * 4200);
    const pnl = triggered ? triggeredPnl : synthetic;
    out.push({
      iso,
      date: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      pnl,
      triggered,
    });
  }
  return out;
}

type ActivityEvent = {
  time: string;
  kind: "info" | "warning" | "trigger" | "action";
  msg: string;
};

function buildTodayActivity(latestTrigger?: { triggeredAt: Date }): ActivityEvent[] {
  const now = new Date();
  return [
    { time: "09:15:00", kind: "info", msg: "Monitor started · market open" },
    {
      time: "10:47:23",
      kind: "info",
      msg: "14 trades executed across NIFTY + BANKNIFTY",
    },
    {
      time: "11:02:15",
      kind: "warning",
      msg: "Warning — trade count at 80% of limit",
    },
    {
      time: now.toTimeString().slice(0, 8),
      kind: "info",
      msg: latestTrigger
        ? "Monitoring continues · last trigger " +
          latestTrigger.triggeredAt.toLocaleDateString("en-IN")
        : "Monitoring continues",
    },
  ];
}
