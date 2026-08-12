import { NextResponse } from "next/server";
import { listIncomingChallengeReveals } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const requests = await listIncomingChallengeReveals(userId);
  return NextResponse.json({ requests });
}
