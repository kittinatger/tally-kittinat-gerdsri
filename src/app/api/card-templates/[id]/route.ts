import { NextRequest, NextResponse } from "next/server";
import { reviewCardTemplate } from "@/lib/db";
import { toCardTemplateOption } from "@/lib/wallet-mapper";
import { cardTemplateReviewSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Admin-only — approve or reject a pending submission.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!(await isAdminUser(userId))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const { id } = await params;
  const templateId = parseId(id);
  if (templateId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const parsed = cardTemplateReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const template = await reviewCardTemplate(templateId, parsed.data.status);
  if (!template) {
    return NextResponse.json({ error: "Not found, or already reviewed" }, { status: 404 });
  }
  return NextResponse.json({ template: toCardTemplateOption(template) });
}
