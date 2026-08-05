// Sends transactional email via Resend's HTTP API directly (no SDK
// dependency) — requires RESEND_API_KEY. EMAIL_FROM is optional and falls
// back to Resend's shared testing sender, which only delivers to the email
// address on the Resend account itself; a real deployment should set
// EMAIL_FROM to an address on a domain verified with Resend.
export async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY environment variable is not set." };
  }
  const from = process.env.EMAIL_FROM || "Tally <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Resend API error (${res.status}): ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error while sending email." };
  }
}

export function passwordResetEmailHtml(resetUrl: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1f7a5c;">Reset your Tally password</h2>
      <p>Someone requested a password reset for this Tally account. If this was you, click below to choose a new password. This link expires in 1 hour.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #1f7a5c; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">Reset password</a>
      </p>
      <p style="color: #666; font-size: 13px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    </div>
  `;
}
