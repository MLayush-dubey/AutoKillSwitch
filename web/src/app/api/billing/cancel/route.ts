import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.subscription.update({
    where: { userId: session.user.id },
    data: { status: "canceled" },
  });

  return NextResponse.json({ ok: true });
}
