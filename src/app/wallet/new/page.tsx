import { getCurrency } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import WalletFormPage from "@/components/WalletFormPage";
import { safeReturnPath } from "@/lib/return-path";

export const dynamic = "force-dynamic";

// Adding a wallet or card on its own page. ?from= is where Cancel and a save go.
export default async function NewWalletPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const userId = await getUserId();
  return <WalletFormPage currency={await getCurrency(userId)} returnTo={safeReturnPath(from)} />;
}
