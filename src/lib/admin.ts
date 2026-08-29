import { getUserById } from "@/lib/db";
import { ADMIN_EMAIL } from "@/lib/admin-constants";

// The single reviewer for user-submitted card templates (see card_templates
// in db.ts) — this is a personal app, not a multi-tenant product, so
// "admin" just means "the account that owns this deployment" rather than a
// real roles table. Server-only (imports db.ts) — client components that
// just need the email itself should import admin-constants.ts directly.
export async function isAdminUser(userId: number): Promise<boolean> {
  const user = await getUserById(userId);
  return Boolean(user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
}

export { ADMIN_EMAIL };
