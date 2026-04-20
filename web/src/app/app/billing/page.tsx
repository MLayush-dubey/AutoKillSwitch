import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { planByDb, synthInvoices } from "@/lib/billing";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  // If the user finished signup but somehow has no subscription row yet,
  // seed a trialing one so the billing screen renders coherently.
  if (!sub) {
    const now = new Date();
    const end = new Date(now);
    end.setMonth(now.getMonth() + 1);
    sub = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        plan: "MONTHLY",
        status: "trialing",
        currentPeriodStart: now,
        currentPeriodEnd: end,
      },
    });
  }

  const currentPlan = planByDb(sub.plan);
  const invoices = synthInvoices({
    plan: sub.plan,
    currentPeriodStart: sub.currentPeriodStart,
    currentPeriodEnd: sub.currentPeriodEnd,
  });

  return (
    <BillingClient
      subscription={{
        plan: sub.plan,
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart.toISOString(),
        currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      }}
      currentPlanId={currentPlan.id}
      invoices={invoices.map((i) => ({ ...i, date: i.date.toISOString() }))}
    />
  );
}
