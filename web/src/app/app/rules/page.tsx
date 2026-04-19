import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { defaultRules, type RulesInput } from "@/lib/rules";
import { RulesForm } from "./rules-form";

export default async function RulesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rules = await prisma.rules.findUnique({
    where: { userId: session.user.id },
  });

  const initial: RulesInput = rules
    ? {
        maxDailyLoss: rules.maxDailyLoss,
        maxDailyProfit: rules.maxDailyProfit,
        maxTrades: rules.maxTrades,
        warningThresholdPct: rules.warningThresholdPct,
        telegramWarnings: rules.telegramWarnings,
        timeBasedExit: rules.timeBasedExit,
        perTradeLossLimit: rules.perTradeLossLimit,
        consecutiveLossLimit: rules.consecutiveLossLimit,
      }
    : defaultRules;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rules</h1>
        <p className="text-sm text-muted-foreground">
          Changes save automatically. Fire daily at 09:00 IST.
        </p>
      </div>
      <RulesForm initial={initial} />
    </div>
  );
}
