import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const updated = await prisma.brokerConnection.update({
    where: { userId: session.user.id },
    data: {
      tokenExpiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
      lastCheckedAt: new Date(),
      isActive: true,
    },
  });

  return NextResponse.json({ tokenExpiresAt: updated.tokenExpiresAt });
}
