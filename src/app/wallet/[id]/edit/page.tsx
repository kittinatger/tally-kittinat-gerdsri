import { notFound } from "next/navigation";
import { getCurrency, getDefaultSignature, getWalletById } from "@/lib/db";
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
  searchParams: Promise<{ from?: string; tab?: string }>;
}) {
  const { id: rawId } = await params;
  const { from, tab } = await searchParams;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const userId = await getUserId();
  const [row, currency, defaultSignature] = await Promise.all([
    getWalletById(userId, id),
    getCurrency(userId),
    getDefaultSignature(userId),
  ]);
  const wallet = row ? toWalletOption(row) : null;
  if (!wallet || !wallet.isOwner) notFound();
  const initialTab = tab === "back" || tab === "card" || tab === "premade" ? tab : undefined;
  return (
    <WalletFormPage
      wallet={wallet}
      currency={currency}
      returnTo={safeReturnPath(from, `/wallet/${id}`)}
      initialTab={initialTab}
      defaultSignature={defaultSignature}
    />
  );
}
