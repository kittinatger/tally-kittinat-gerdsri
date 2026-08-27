import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listWebauthnCredentials, deleteWebauthnCredential, getAppLockEnabled, setAppLockEnabled } from "@/lib/db";
import { checkMutationRateLimit } from "@/lib/mutation-rate-limit";

export async function GET() {
  const userId = await getUserId();
  const [credentials, enabled] = await Promise.all([listWebauthnCredentials(userId), getAppLockEnabled(userId)]);
  return NextResponse.json({
    enabled,
    credentials: credentials.map((c) => ({
      id: c.id,
      deviceLabel: c.device_label,
      createdAt: c.created_at,
      lastUsedAt: c.last_used_at,
    })),
  });
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!checkMutationRateLimit(userId)) {
    return NextResponse.json({ error: "Too many requests. Slow down and try again shortly." }, { status: 429 });
  }
  const { enabled } = (await req.json()) as { enabled: boolean };
  if (enabled) {
    const credentials = await listWebauthnCredentials(userId);
    if (credentials.length === 0) {
      return NextResponse.json({ error: "Enroll a device before turning this on." }, { status: 400 });
    }
  }
  await setAppLockEnabled(userId, Boolean(enabled));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!checkMutationRateLimit(userId)) {
    return NextResponse.json({ error: "Too many requests. Slow down and try again shortly." }, { status: 429 });
  }
  const { id } = (await req.json()) as { id: number };
  await deleteWebauthnCredential(userId, id);
  const remaining = await listWebauthnCredentials(userId);
  // Auto-disable app-lock once the last enrolled device is removed — an
  // enabled lock with nothing to unlock it would strand the user.
  if (remaining.length === 0) {
    await setAppLockEnabled(userId, false);
  }
  return NextResponse.json({ ok: true });
}
