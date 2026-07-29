import { NextRequest, NextResponse } from "next/server";
import { listCategories, createCategory } from "@/lib/db";
import { categoryInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505";
}

export async function GET() {
  const userId = await getUserId();
  const categories = await listCategories(userId);
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const category = await createCategory(userId, parsed.data.type, parsed.data.name, parsed.data.color);
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ error: "A category with that name already exists." }, { status: 409 });
    }
    throw err;
  }
}
