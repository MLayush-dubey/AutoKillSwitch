import { plans, type Plan } from "@/lib/pricing";
import { dbIdByPlan, type DbPlanId } from "@/lib/billing";

/**
 * Razorpay test-mode shim. In production, these functions call the Razorpay
 * Subscriptions API. For the sales demo we expose the same interface and
 * return stable fake identifiers so the rest of the app has nothing to know.
 *
 * Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in .env to light up the real SDK
 * (a one-line swap when you're ready).
 */
export type RazorpayResult = {
  subscriptionId: string;
  nextPeriodEnd: Date;
  mocked: boolean;
};

export async function createOrUpdateSubscription(args: {
  userId: string;
  plan: Plan;
  now?: Date;
}): Promise<RazorpayResult> {
  const now = args.now ?? new Date();
  const end = new Date(now);
  end.setMonth(now.getMonth() + args.plan.cycleMonths);

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return {
      subscriptionId: `sub_test_${args.userId.slice(0, 8)}_${dbIdByPlan[args.plan.id]}`,
      nextPeriodEnd: end,
      mocked: true,
    };
  }

  // Real integration would live here. Kept intentionally absent — Razorpay's
  // SDK requires server-only secrets we don't want to pull until a customer
  // is ready to pay.
  throw new Error("Razorpay live mode not wired for the demo build.");
}

export function planFromDb(dbId: DbPlanId): Plan {
  const p = plans.find((pl) => dbIdByPlan[pl.id] === dbId);
  if (!p) throw new Error(`Unknown plan id: ${dbId}`);
  return p;
}
