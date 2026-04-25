import { plans, type Plan } from "@/lib/pricing";

export type DbPlanId = "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "ANNUAL";

export const planIdByDb: Record<DbPlanId, Plan["id"]> = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  HALF_YEARLY: "half_yearly",
  ANNUAL: "annual",
};

export const dbIdByPlan: Record<Plan["id"], DbPlanId> = {
  monthly: "MONTHLY",
  quarterly: "QUARTERLY",
  half_yearly: "HALF_YEARLY",
  annual: "ANNUAL",
};

export function planByDb(dbId: string): Plan {
  const key = (dbId as DbPlanId) ?? "MONTHLY";
  const id = planIdByDb[key] ?? "monthly";
  return plans.find((p) => p.id === id) ?? plans[0];
}

/**
 * Crude proration: remaining-days value of the current plan applied as a
 * credit against the new plan's full cycle cost. Good enough for the sales
 * demo — real Razorpay subscriptions track proration upstream.
 */
export function prorateUpgrade(args: {
  currentPlan: Plan;
  newPlan: Plan;
  periodStart: Date;
  periodEnd: Date;
  now?: Date;
}) {
  const now = args.now ?? new Date();
  const totalMs = args.periodEnd.getTime() - args.periodStart.getTime();
  const remainingMs = Math.max(0, args.periodEnd.getTime() - now.getTime());
  const fraction = totalMs > 0 ? remainingMs / totalMs : 0;
  const credit = Math.round(args.currentPlan.total * fraction);
  const due = Math.max(0, args.newPlan.total - credit);
  return { credit, due };
}

export type InvoiceRow = {
  id: string;
  date: Date;
  planLabel: string;
  amount: number;
  status: "paid" | "pending" | "refunded";
};

/**
 * Synthesises an invoice history for the demo. Deterministic from the
 * subscription start date — same user sees the same list on every render.
 */
export function synthInvoices(sub: {
  plan: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}): InvoiceRow[] {
  const plan = planByDb(sub.plan);
  const rows: InvoiceRow[] = [];
  const cycleMs =
    sub.currentPeriodEnd.getTime() - sub.currentPeriodStart.getTime();

  for (let i = 0; i < 3; i++) {
    const d = new Date(sub.currentPeriodStart.getTime() - cycleMs * i);
    if (d.getFullYear() < 2024) break;
    rows.push({
      id: `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${String(1000 + i).slice(1)}`,
      date: d,
      planLabel: plan.name,
      amount: plan.total,
      status: i === 0 ? "paid" : "paid",
    });
  }
  return rows;
}
