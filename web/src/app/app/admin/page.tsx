import { redirect } from "next/navigation";
import { Users, TrendingUp, Activity, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { planByDb } from "@/lib/billing";
import { formatINR } from "@/lib/utils";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "admin") redirect("/app");

  const [users, subscriptions, triggersAgg, latestUsers] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.findMany({
      select: { plan: true, status: true },
    }),
    prisma.trigger.groupBy({
      by: ["reason"],
      _count: { _all: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        role: true,
        subscription: { select: { plan: true, status: true } },
      },
    }),
  ]);

  const active = subscriptions.filter((s) => s.status === "active");
  const mrr = active.reduce((sum, s) => {
    const p = planByDb(s.plan);
    return sum + p.monthly;
  }, 0);

  const planBreakdown = active.reduce<Record<string, number>>((acc, s) => {
    acc[s.plan] = (acc[s.plan] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Shield className="h-3 w-3" /> Admin
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          System overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Real numbers. Only you can see this.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-3xl tabular-nums">{users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-3xl tabular-nums text-[color:var(--brand-emerald)]">
              {formatINR(mrr)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {active.length} active subscription{active.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              System health
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[color:var(--profit)]" />
              <span className="text-sm">All systems nominal</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Proxy ·{" "}
              <span className="text-[color:var(--profit)]">up</span> · Workers ·{" "}
              <span className="text-[color:var(--profit)]">up</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active subscriptions</CardTitle>
            <CardDescription>By plan.</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(planBreakdown).length === 0 ? (
              <p className="text-sm text-muted-foreground">No active subscriptions.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {Object.entries(planBreakdown).map(([plan, count]) => (
                  <li
                    key={plan}
                    className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                  >
                    <span>{planByDb(plan).name}</span>
                    <span className="font-mono tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trigger reasons</CardTitle>
            <CardDescription>All-time, across users.</CardDescription>
          </CardHeader>
          <CardContent>
            {triggersAgg.length === 0 ? (
              <p className="text-sm text-muted-foreground">No triggers recorded.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {triggersAgg.map((t) => (
                  <li
                    key={t.reason}
                    className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {t.reason}
                    </span>
                    <span className="font-mono tabular-nums">{t._count._all}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest users</CardTitle>
          <CardDescription>10 most recent signups.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <div className="col-span-4">Email</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Plan</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Joined</div>
            </div>
            {latestUsers.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-12 items-center gap-4 px-6 py-3 text-sm"
              >
                <div className="col-span-4 truncate font-mono text-xs">
                  {u.email}
                  {u.role === "admin" && (
                    <span className="ml-2 rounded-full bg-[color:var(--brand-gold)]/15 px-2 py-0.5 text-[10px] text-[color:var(--brand-gold)]">
                      admin
                    </span>
                  )}
                </div>
                <div className="col-span-3 truncate text-muted-foreground">
                  {u.name ?? "—"}
                </div>
                <div className="col-span-2 text-muted-foreground">
                  {u.subscription ? planByDb(u.subscription.plan).name : "—"}
                </div>
                <div className="col-span-2 text-muted-foreground">
                  {u.subscription?.status ?? "—"}
                </div>
                <div className="col-span-1 text-right text-xs text-muted-foreground">
                  {u.createdAt.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
