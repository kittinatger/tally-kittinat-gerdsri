import { NextRequest, NextResponse } from "next/server";
import { listMembershipCards, createMembershipCard } from "@/lib/db";
import { membershipInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const cards = await listMembershipCards(userId);
  return NextResponse.json({ cards });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = membershipInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const card = await createMembershipCard(userId, parsed.data);
  return NextResponse.json({ card }, { status: 201 });
}
