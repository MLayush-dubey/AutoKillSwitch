import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HistoryView, type TriggerRow } from "./history-view";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const triggers = await prisma.trigger.findMany({
    where: { userId: session.user.id },
    orderBy: { triggeredAt: "desc" },
  });

  const rows: TriggerRow[] = triggers.map((t) => ({
    id: t.id,
    triggeredAt: t.triggeredAt.toISOString(),
    reason: t.reason as TriggerRow["reason"],
    pnl: t.pnlAtTrigger,
    trades: t.tradeCountAtTrigger,
    cancelled: t.ordersCancelled,
    flattened: t.positionsFlattened,
    events: safeParseEvents(t.eventsJson),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground">
          Every time the killswitch fired — and everything it did.
        </p>
      </div>
      <HistoryView rows={rows} />
    </div>
  );
}

function safeParseEvents(json: string): TriggerRow["events"] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* fallthrough */
  }
  return [];
}
