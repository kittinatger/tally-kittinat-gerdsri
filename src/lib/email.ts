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

export function recurringLoggedEmailHtml(
  items: { merchant: string; amount: number; date: string; type: string }[],
  currency: string,
): string {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;color:#333;">${i.merchant}</td><td style="padding:6px 0;color:#666;text-align:right;">${i.type === "income" ? "+" : "-"}${i.amount.toFixed(2)} ${currency}</td><td style="padding:6px 0;color:#999;text-align:right;">${i.date}</td></tr>`,
    )
    .join("");
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1f7a5c;">Recurring transactions logged</h2>
      <p>Tally just auto-logged ${items.length} recurring transaction${items.length === 1 ? "" : "s"} on your account:</p>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">${rows}</table>
      <p style="color: #666; font-size: 13px; margin-top: 20px;">Manage recurring transactions in Settings &gt; Budgeting.</p>
    </div>
  `;
}

export function budgetOverLimitEmailHtml(category: string, spent: number, limit: number, currency: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Over budget: ${category}</h2>
      <p>You've spent ${spent.toFixed(2)} ${currency} against your ${limit.toFixed(2)} ${currency} monthly budget for <strong>${category}</strong> this month.</p>
      <p style="color: #666; font-size: 13px; margin-top: 20px;">Manage budgets in Settings &gt; Budgeting.</p>
    </div>
  `;
}
