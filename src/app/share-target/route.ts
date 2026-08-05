import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { importReceiptImage } from "@/lib/receipt-intake";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

// Registered as the Web Share Target in public/manifest.json — only
// reachable this way once the PWA is installed (Android; iOS/Safari
// doesn't support this API for web apps at all, see Settings > Automatic
// import for the iOS Shortcuts alternative). This runs inside the
// installed app's own browser context, so the normal session cookie
// applies — getUserId() works exactly as it does on any other page.
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const formData = await req.formData().catch(() => null);
  const files = (formData?.getAll("images") ?? []).filter((f): f is File => f instanceof File);

  let imported = 0;
  let skipped = 0;
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES) {
      skipped++;
      continue;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importReceiptImage(userId, buffer, file.type);
    if (result.ok) imported++;
    else skipped++;
  }

  const url = new URL("/share-target/done", req.url);
  url.searchParams.set("imported", String(imported));
  url.searchParams.set("skipped", String(skipped));
  return NextResponse.redirect(url, 303);
}
