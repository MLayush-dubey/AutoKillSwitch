import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOrUpdateSubscription, planFromDb } from "@/lib/razorpay";
import { sendPlanChanged } from "@/lib/emails";

const schema = z.object({
  plan: z.enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const plan = planFromDb(parsed.data.plan);
  const result = await createOrUpdateSubscription({
    userId: session.user.id,
    plan,
  });

  const now = new Date();
  await prisma.subscription.upsert({
    where: { userId: session.user.id },
    update: {
      plan: parsed.data.plan,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: result.nextPeriodEnd,
      razorpaySubscriptionId: result.subscriptionId,
    },
    create: {
      userId: session.user.id,
      plan: parsed.data.plan,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: result.nextPeriodEnd,
      razorpaySubscriptionId: result.subscriptionId,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });
  if (user?.email) {
    await sendPlanChanged({
      to: user.email,
      name: user.name ?? "there",
      plan,
      nextCharge: result.nextPeriodEnd,
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, mocked: result.mocked });
}
