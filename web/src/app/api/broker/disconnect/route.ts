import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await prisma.brokerConnection
    .update({
      where: { userId: session.user.id },
      data: {
        isActive: false,
        tokenExpiresAt: null,
      },
    })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
