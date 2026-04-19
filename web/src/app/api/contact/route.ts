import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactMessage } from "@/lib/email";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  topic: z.string().max(50).optional(),
  message: z.string().min(5).max(5000),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please fill in all fields correctly." },
      { status: 400 }
    );
  }

  try {
    const result = await sendContactMessage(parsed.data);
    return NextResponse.json({ ok: true, mocked: result.mocked });
  } catch (err) {
    console.error("[contact] send failed", err);
    return NextResponse.json(
      { message: "We couldn't send your message right now. Try again shortly." },
      { status: 502 }
    );
  }
}
