import { NextResponse } from "next/server";
import { listNotifications, countUnreadNotifications } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { ensureAppUpdateNotification } from "@/lib/notify-events";

export async function GET() {
  const userId = await getUserId();
  // Usually a no-op single UPDATE; right after a release it adds the
  // "Tally X is here" notification first, so it's in this very response.
  await ensureAppUpdateNotification(userId);
  const [notifications, unreadCount] = await Promise.all([
    listNotifications(userId),
    countUnreadNotifications(userId),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}
