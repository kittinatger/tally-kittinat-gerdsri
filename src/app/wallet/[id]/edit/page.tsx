import { notFound } from "next/navigation";
import { getCurrency, listWallets } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { toWalletOption } from "@/lib/wallet-mapper";
import WalletFormPage from "@/components/WalletFormPage";
import { safeReturnPath } from "@/lib/return-path";

export const dynamic = "force-dynamic";

// Editing a wallet or card on its own page — only its owner can.
export default async function EditWalletPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id: rawId } = await params;
  const { from } = await searchParams;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const userId = await getUserId();
  const [rows, currency] = await Promise.all([listWallets(userId, { includeArchived: true }), getCurrency(userId)]);
  const wallet = rows.map(toWalletOption).find((w) => w.id === id);
  if (!wallet || !wallet.isOwner) notFound();
  return <WalletFormPage wallet={wallet} currency={currency} returnTo={safeReturnPath(from, `/wallet/${id}`)} />;
}
