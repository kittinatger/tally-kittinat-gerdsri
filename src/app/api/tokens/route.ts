import { NextRequest, NextResponse } from "next/server";
import { listApiTokens, createApiToken } from "@/lib/db";
import { apiTokenInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const tokens = await listApiTokens(userId);
  return NextResponse.json({ tokens });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = apiTokenInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id, token } = await createApiToken(userId, parsed.data.name);
  return NextResponse.json({ id, token }, { status: 201 });
}
