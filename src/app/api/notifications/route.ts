import { NextResponse } from "next/server";
import { listNotifications, countUnreadNotifications } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const [notifications, unreadCount] = await Promise.all([
    listNotifications(userId),
    countUnreadNotifications(userId),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}
