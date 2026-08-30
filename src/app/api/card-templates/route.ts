import { NextRequest, NextResponse } from "next/server";
import { createCardTemplate, listApprovedCardTemplates, listAllCardTemplates } from "@/lib/db";
import { toCardTemplateOption } from "@/lib/wallet-mapper";
import { cardTemplateInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

// ?status=approved (default) — the public "premade card" gallery, same for
// every user. ?status=all — every template regardless of status, for the
// admin's manage-templates page; gated server-side here rather than
// trusting a client-side admin check.
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  const wantsAll = req.nextUrl.searchParams.get("status") === "all";
  if (wantsAll && !(await isAdminUser(userId))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const rows = wantsAll ? await listAllCardTemplates() : await listApprovedCardTemplates();
  return NextResponse.json({ templates: rows.map(toCardTemplateOption) });
}

// Any signed-in user can submit — it lands as 'pending' and isn't visible
// to anyone else until the admin approves it.
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = cardTemplateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const template = await createCardTemplate(userId, parsed.data);
  return NextResponse.json({ template: toCardTemplateOption(template) }, { status: 201 });
}
