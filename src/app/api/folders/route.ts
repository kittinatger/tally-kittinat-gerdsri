import { NextRequest, NextResponse } from "next/server";
import { createFolder } from "@/lib/db";
import { folderCreateSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = folderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const folder = await createFolder(userId, parsed.data.kind, parsed.data.name, parsed.data.color);
  return NextResponse.json({ folder }, { status: 201 });
}
