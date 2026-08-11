import { NextRequest, NextResponse } from "next/server";
import { searchUsers } from "@/lib/db";
import { userSearchQuerySchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  const parsed = userSearchQuerySchema.safeParse({ q: req.nextUrl.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ results: [] });
  }
  const results = await searchUsers(userId, parsed.data.q);
  return NextResponse.json({ results });
}
