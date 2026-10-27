import { notFound } from "next/navigation";
import { getMembershipCardById, listFolders } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { toMembershipCard } from "@/lib/membership-card-mapper";
import PassDetailPage from "@/components/PassDetailPage";

export const dynamic = "force-dynamic";

// A pass/membership card on its own page (tap one on the Wallet page),
// same idea as /wallet/[id] for accounts and payment cards.
export default async function PassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const userId = await getUserId();
  const [row, folders] = await Promise.all([getMembershipCardById(userId, id), listFolders(userId, "pass")]);
  if (!row) notFound();
  const card = toMembershipCard(row);
  return <PassDetailPage card={card} folders={folders} />;
}
