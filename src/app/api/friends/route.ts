import { NextResponse } from "next/server";
import { listFriends, listFamilyMembers, listIncomingFriendRequests, listOutgoingFriendRequests } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const [friends, family, incoming, outgoing] = await Promise.all([
    listFriends(userId),
    listFamilyMembers(userId),
    listIncomingFriendRequests(userId),
    listOutgoingFriendRequests(userId),
  ]);
  return NextResponse.json({ friends, family, incoming, outgoing });
}
