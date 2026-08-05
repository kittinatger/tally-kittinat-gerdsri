import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createPasswordResetToken, countRecentPasswordResetTokens } from "@/lib/db";
import { forgotPasswordInputSchema } from "@/lib/validation";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email";

// Always returns the same generic response regardless of whether the email
// matches an account, so this endpoint can't be used to enumerate which
// addresses have a Tally account.
const GENERIC_RESPONSE = { message: "If that email has a Tally account, a reset link is on its way." };

// At most 3 reset requests per account per 15 minutes — stops a single
// account's inbox (and Resend quota) from being hammered, while staying
// enumeration-safe: silently rate-limited requests get the exact same
// response as a successful one.
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MINUTES = 15;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await getUserByEmail(parsed.data.email);
  if (!user) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const recentCount = await countRecentPasswordResetTokens(user.id, RATE_LIMIT_WINDOW_MINUTES);
  if (recentCount >= RATE_LIMIT_MAX) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const token = await createPasswordResetToken(user.id);
  const resetUrl = `${req.nextUrl.origin}/reset-password?token=${token}`;
  const result = await sendEmail(user.email!, "Reset your Tally password", passwordResetEmailHtml(resetUrl));

  // Deliberately returns the same generic response either way — surfacing a
  // send failure here (vs. the "email not found" case above) would let an
  // attacker distinguish registered emails from unregistered ones. Send
  // failures are only visible in server logs.
  if (!result.ok) {
    console.error("Failed to send password reset email:", result.error);
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
