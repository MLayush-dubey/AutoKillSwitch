import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrokerActions } from "./broker-actions";

export default async function BrokerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const broker = await prisma.brokerConnection.findUnique({
    where: { userId: session.user.id },
  });

  if (!broker || !broker.isActive) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Broker</h1>
          <p className="text-sm text-muted-foreground">
            Dhan account connection.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No account connected</CardTitle>
            <CardDescription>
              Connect your Dhan account to begin monitoring.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/app/onboarding">Connect Dhan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Broker</h1>
        <p className="text-sm text-muted-foreground">
          Dhan account connection and infrastructure status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Dhan</CardTitle>
              <CardDescription>
                Connected as{" "}
                <span className="font-mono tabular-nums">{broker.clientId}</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[color:var(--profit)]/10 px-3 py-1 text-xs font-medium text-[color:var(--profit)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--profit)]" />
              Active
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <TokenExpiry tokenExpiresAt={broker.tokenExpiresAt?.toISOString() ?? null} />
          <BrokerActions />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Static IP whitelist</CardTitle>
          <CardDescription>
            Dhan requires a whitelisted source IP for API access. We handle this
            for you via dedicated ISP infrastructure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-md border border-border bg-background/40 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Source IP</span>
            <span className="font-mono tabular-nums">{broker.staticIp}</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border bg-background/40 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="text-[color:var(--profit)]">Whitelisted</span>
          </div>
          <p className="pt-2 text-xs text-muted-foreground">
            Powered by our dedicated ISP proxy. No action needed on your side.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TokenExpiry({ tokenExpiresAt }: { tokenExpiresAt: string | null }) {
  if (!tokenExpiresAt) return null;
  const hours = Math.max(
    0,
    Math.round(
      (new Date(tokenExpiresAt).getTime() - Date.now()) / (60 * 60 * 1000)
    )
  );
  const pct = Math.min(100, Math.round((hours / 24) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Access token expires</span>
        <span className="font-mono tabular-nums">in {hours}h</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[color:var(--brand-emerald)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
