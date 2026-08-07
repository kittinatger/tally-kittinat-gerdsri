import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUserById, unlinkGithubId, logSecurityEvent } from "@/lib/db";

export async function DELETE() {
  const userId = await getUserId();
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  if (!user.github_id) {
    return NextResponse.json({ error: "GitHub isn't linked to this account." }, { status: 400 });
  }
  // Unlinking with no password would leave the account with no way to sign
  // in at all — block it rather than lock someone out of their own data.
  if (!user.password_hash) {
    return NextResponse.json(
      { error: "Set a password first — otherwise unlinking GitHub would lock you out of this account." },
      { status: 400 },
    );
  }

  await unlinkGithubId(userId);
  await logSecurityEvent(userId, "github_account_unlinked");
  return NextResponse.json({ ok: true });
}
