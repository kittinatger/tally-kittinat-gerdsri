import { NextResponse } from "next/server";
import { listMyPendingWalletInvites } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const invites = await listMyPendingWalletInvites(userId);
  return NextResponse.json({ invites });
}
