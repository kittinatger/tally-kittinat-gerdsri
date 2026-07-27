import { NextRequest, NextResponse } from "next/server";
import { updateCategory, deleteCategory } from "@/lib/db";
import { categoryUpdateSchema } from "@/lib/validation";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categoryId = parseId(id);
  if (categoryId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = categoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const category = await updateCategory(categoryId, parsed.data);
    if (!category) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ error: "A category with that name already exists." }, { status: 409 });
    }
    if (err instanceof Error && err.message.includes("can't be renamed")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categoryId = parseId(id);
  if (categoryId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const result = await deleteCategory(categoryId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
