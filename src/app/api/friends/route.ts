import { NextResponse } from "next/server";
import {
  listFriends,
  listFamilyMembers,
  listIncomingFriendRequests,
  listOutgoingFriendRequests,
  getFriendNetBalances,
} from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const [friends, family, incoming, outgoing, balances] = await Promise.all([
    listFriends(userId),
    listFamilyMembers(userId),
    listIncomingFriendRequests(userId),
    listOutgoingFriendRequests(userId),
    getFriendNetBalances(userId),
  ]);
  return NextResponse.json({
    friends,
    family,
    incoming,
    outgoing,
    // Map isn't JSON-serializable directly — a plain {friendId: amount}
    // object is the simplest shape for the client to index into.
    balances: Object.fromEntries(balances),
  });
}
