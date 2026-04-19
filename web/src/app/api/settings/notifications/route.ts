import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  emailOnTrigger: z.boolean().optional(),
  telegramEnabled: z.boolean().optional(),
  telegramBotToken: z.string().max(200).nullable().optional(),
  telegramChatId: z.string().max(80).nullable().optional(),
  dailySummaryEnabled: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      emailOnTrigger: true,
      telegramEnabled: true,
      telegramBotToken: true,
      telegramChatId: true,
      dailySummaryEnabled: true,
    },
  });
  return NextResponse.json({ user });
}
