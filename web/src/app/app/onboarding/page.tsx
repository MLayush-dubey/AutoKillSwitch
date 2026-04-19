import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { defaultRules, type RulesInput } from "@/lib/rules";
import { OnboardingWizard } from "./wizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, rules, broker] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.rules.findUnique({ where: { userId: session.user.id } }),
    prisma.brokerConnection.findUnique({ where: { userId: session.user.id } }),
  ]);

  const initialRules: RulesInput = rules
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
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Three minutes. Then we get out of your way.
          </p>
        </div>
        <Link
          href="/app"
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Skip for now
        </Link>
      </div>

      <OnboardingWizard
        initialRules={initialRules}
        brokerConnected={!!broker?.isActive}
        alreadyOnboarded={!!user?.onboardedAt}
      />
    </div>
  );
}
