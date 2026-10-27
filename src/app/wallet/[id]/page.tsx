import { notFound } from "next/navigation";
import { getCurrency, getDefaultSignature, getWalletById, listFolders } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { toWalletOption } from "@/lib/wallet-mapper";
import WalletDetailPage from "@/components/WalletDetailPage";

export const dynamic = "force-dynamic";

// A card or account on its own page (tap one on the Wallet page).
export default async function WalletPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const userId = await getUserId();
  const [row, folders, defaultSignature, currency] = await Promise.all([
    getWalletById(userId, id),
    listFolders(userId, "wallet"),
    getDefaultSignature(userId),
    getCurrency(userId),
  ]);
  if (!row) notFound();
  const wallet = toWalletOption(row);
  return <WalletDetailPage wallet={wallet} folders={folders} defaultSignature={defaultSignature} currency={currency} />;
}
