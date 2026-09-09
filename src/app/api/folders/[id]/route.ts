import { NextRequest, NextResponse } from "next/server";
import { updateFolder, deleteFolder } from "@/lib/db";
import { folderUpdateSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const folderId = parseId(id);
  if (folderId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const parsed = folderUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const folder = await updateFolder(userId, folderId, parsed.data);
  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ folder });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const folderId = parseId(id);
  if (folderId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ok = await deleteFolder(userId, folderId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
