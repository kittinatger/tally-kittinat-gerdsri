import { NextRequest, NextResponse } from "next/server";
import { listTags, renameTag, deleteTag } from "@/lib/db";
import { getUserId } from "@/lib/auth";

const MAX_TAG_LENGTH = 40;

export async function GET() {
  const userId = await getUserId();
  const tags = await listTags(userId);
  return NextResponse.json({ tags });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const oldName = typeof body?.oldName === "string" ? body.oldName.trim() : "";
  const newName = typeof body?.newName === "string" ? body.newName.trim() : "";

  if (!oldName || !newName) {
    return NextResponse.json({ error: "Both oldName and newName are required." }, { status: 400 });
  }
  if (newName.length > MAX_TAG_LENGTH) {
    return NextResponse.json({ error: `Tag must be ${MAX_TAG_LENGTH} characters or fewer.` }, { status: 400 });
  }

  await renameTag(userId, oldName, newName);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  await deleteTag(userId, name);
  return NextResponse.json({ ok: true });
}
