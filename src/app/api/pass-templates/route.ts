import { NextRequest, NextResponse } from "next/server";
import { createPassTemplate, listApprovedPassTemplates, listAllPassTemplates } from "@/lib/db";
import { toPassTemplateOption } from "@/lib/membership-card-mapper";
import { passTemplateInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

// ?status=approved (default) — the public "premade pass" gallery, same for
// every user. ?status=all — every template regardless of status, for the
// admin's review panel; gated server-side rather than trusting a
// client-side admin check. Same convention as /api/card-templates.
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  const wantsAll = req.nextUrl.searchParams.get("status") === "all";
  if (wantsAll && !(await isAdminUser(userId))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const rows = wantsAll ? await listAllPassTemplates() : await listApprovedPassTemplates();
  return NextResponse.json({ templates: rows.map(toPassTemplateOption) });
}

// Any signed-in user can submit — it lands as 'pending' and isn't visible
// to anyone else until the admin approves it.
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = passTemplateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const template = await createPassTemplate(userId, parsed.data);
  return NextResponse.json({ template: toPassTemplateOption(template) }, { status: 201 });
}
