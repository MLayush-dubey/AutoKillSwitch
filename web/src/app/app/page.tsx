import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Week 1: dashboard shell only. Live data + charts ship in Week 3.
export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Your trading discipline, visualized.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Today&apos;s P&amp;L</CardDescription>
            <CardTitle className="font-mono text-3xl tabular-nums text-[color:var(--profit)]">
              +₹0.00
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            from 0 trades
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Killswitch</CardDescription>
            <CardTitle className="text-xl">Idle — market closed</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Monitoring resumes at 09:15 IST
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Today&apos;s limits</CardDescription>
            <CardTitle className="text-xl">Not yet configured</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Set them in <span className="underline">Rules</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Week 1 foundation</CardTitle>
          <CardDescription>
            Layouts, design system, Prisma schema, and NextAuth are in. Live
            P&amp;L, activity feed, charts, rules config, and history land in
            Weeks 2–4.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
