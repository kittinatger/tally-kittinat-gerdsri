import { NextRequest, NextResponse, after } from "next/server";
import { listSplits, createSplit, getCurrency } from "@/lib/db";
import { splitInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";
import { notifySplitAdded } from "@/lib/notify-events";

export async function GET() {
  const userId = await getUserId();
  const splits = await listSplits(userId);
  return NextResponse.json({ splits });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = splitInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await createSplit(userId, parsed.data);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const input = parsed.data;
  after(async () => notifySplitAdded(userId, input, await getCurrency(userId)));
  return NextResponse.json(result, { status: 201 });
}
