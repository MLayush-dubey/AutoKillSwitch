import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  clientId: z.string().min(3).max(40),
  accessToken: z.string().min(10).max(4000),
  apiKey: z.string().min(3).max(200),
  apiSecret: z.string().min(3).max(200),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please fill in all broker fields." },
      { status: 400 }
    );
  }

  // Demo mode: we don't actually call Dhan. Store masked clientId and mark
  // the connection active. Tokens would be encrypted in the real build.
  const masked = parsed.data.clientId.replace(/.(?=.{4})/g, "*");
  const tokenExpiresAt = new Date(Date.now() + 18 * 60 * 60 * 1000);

  const connection = await prisma.brokerConnection.upsert({
    where: { userId: session.user.id },
    update: {
      clientId: masked,
      tokenExpiresAt,
      isActive: true,
      lastCheckedAt: new Date(),
      staticIp: "91.108.xxx.xxx",
    },
    create: {
      userId: session.user.id,
      broker: "dhan",
      clientId: masked,
      tokenExpiresAt,
      isActive: true,
      lastCheckedAt: new Date(),
      staticIp: "91.108.xxx.xxx",
    },
  });

  return NextResponse.json({ connection });
}
