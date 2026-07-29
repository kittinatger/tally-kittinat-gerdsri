import { headers } from "next/headers";

export async function getUserId(): Promise<number> {
  const h = await headers();
  const raw = h.get("x-user-id");
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Missing or invalid x-user-id header — request did not pass through auth middleware.");
  }
  return id;
}
