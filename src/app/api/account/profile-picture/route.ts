import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getProfilePicture, updateProfilePicture } from "@/lib/db";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const picture = await getProfilePicture(userId);
    if (!picture) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(new Uint8Array(picture), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid image format. Use JPEG, PNG, GIF, or WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image too large. Max 5MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await updateProfilePicture(userId, buffer);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Profile picture upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await updateProfilePicture(userId, null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Profile picture delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
