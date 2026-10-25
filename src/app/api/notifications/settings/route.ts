import { NextRequest, NextResponse } from "next/server";
import { getNotificationSettings, setNotificationTypeEnabled, setNotificationsPaused } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NOTIFICATION_TYPES, type NotificationType } from "@/lib/notification-types";

// Pause lengths offered on the settings page, in minutes.
const PAUSE_OPTIONS = new Set([60, 8 * 60, 24 * 60, 7 * 24 * 60]);

export async function GET() {
  const userId = await getUserId();
  return NextResponse.json(await getNotificationSettings(userId));
}

// Body: { type, enabled } to switch one notification type on/off, or
// { pauseMinutes } (one of PAUSE_OPTIONS, or null to resume) to pause all.
export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (body && "pauseMinutes" in body) {
    const minutes = body.pauseMinutes;
    if (minutes !== null && !(typeof minutes === "number" && PAUSE_OPTIONS.has(minutes))) {
      return NextResponse.json({ error: "Invalid pause length." }, { status: 400 });
    }
    await setNotificationsPaused(userId, minutes);
  } else {
    const type = body?.type;
    if (typeof type !== "string" || !NOTIFICATION_TYPES.some((n) => n.type === type) || typeof body?.enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid notification setting." }, { status: 400 });
    }
    await setNotificationTypeEnabled(userId, type as NotificationType, body.enabled);
  }
  return NextResponse.json(await getNotificationSettings(userId));
}
