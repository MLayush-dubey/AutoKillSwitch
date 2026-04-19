import { NextResponse } from "next/server";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { message: "Type DELETE to confirm." },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: session.user.id } });
  await signOut({ redirect: false });
  return NextResponse.json({ ok: true });
}
