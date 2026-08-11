import { NextRequest, NextResponse } from "next/server";
import { sendFriendRequest } from "@/lib/db";
import { friendRequestInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = friendRequestInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await sendFriendRequest(userId, parsed.data.targetUserId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result, { status: 201 });
}
