import { headers } from "next/headers";
import { isGuestUser } from "@/lib/db";

export async function getUserId(): Promise<number> {
  const h = await headers();
  const raw = h.get("x-user-id");
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Missing or invalid x-user-id header — request did not pass through auth middleware.");
  }
  return id;
}

// Guests (the "continue without an account" accounts) can't use anything that
// spends shared AI quota — a guest costs nothing to mint, so a per-user daily
// cap alone wouldn't bound it. Routes call this right after getUserId() and
// return the response it hands back, if any.
export async function guestBlockedResponse(userId: number): Promise<Response | null> {
  if (!(await isGuestUser(userId))) return null;
  return Response.json({ error: "Create an account to use this feature.", code: "guest_blocked" }, { status: 403 });
}
