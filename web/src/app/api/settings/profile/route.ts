import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(80).optional(),
  phone: z.string().max(20).nullable().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid profile" }, { status: 400 });
  }
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: { name: true, phone: true },
  });
  return NextResponse.json({ user });
}
