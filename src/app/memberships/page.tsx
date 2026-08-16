import { listMembershipCards } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { isMembershipCodeFormat } from "@/lib/memberships";
import { isCategoryIconKey } from "@/lib/category-icons";
import MembershipsView from "@/components/MembershipsView";
import type { MembershipCard } from "@/types/membership";

// Always render fresh, same reasoning as the dashboard/activities pages.
export const dynamic = "force-dynamic";

export default async function MembershipsPage() {
  const userId = await getUserId();
  const rows = await listMembershipCards(userId);
  const cards: MembershipCard[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    codeValue: r.code_value,
    codeFormat: isMembershipCodeFormat(r.code_format) ? r.code_format : "qr",
    color: r.color,
    icon: r.icon && isCategoryIconKey(r.icon) ? r.icon : null,
    notes: r.notes,
  }));

  return <MembershipsView initialCards={cards} />;
}
