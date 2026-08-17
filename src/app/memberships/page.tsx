import { listMembershipCards } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { toMembershipCard } from "@/lib/membership-card-mapper";
import MembershipsView from "@/components/MembershipsView";

// Always render fresh, same reasoning as the dashboard/activities pages.
export const dynamic = "force-dynamic";

export default async function MembershipsPage() {
  const userId = await getUserId();
  const rows = await listMembershipCards(userId);
  const cards = rows.map(toMembershipCard);

  return <MembershipsView initialCards={cards} />;
}
