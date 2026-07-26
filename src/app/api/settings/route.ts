import { NextRequest, NextResponse } from "next/server";
import { getRemaining, setRemaining } from "@/lib/db";
import { settingsInputSchema } from "@/lib/validation";

export async function GET() {
  const remaining = await getRemaining();
  return NextResponse.json({ remaining });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = settingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const remaining = await setRemaining(parsed.data.remaining);
  return NextResponse.json({ remaining });
}
