import { listCategories, getCurrency, getUserById, listWallets, getActivitiesDefaultWalletId } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsView from "@/components/SettingsView";
import { isTransactionType } from "@/lib/categories";
import { toWalletOption } from "@/lib/wallet-mapper";
import { isPanel } from "@/lib/settings-panels";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";

// Always render fresh, same reasoning as the dashboard page.
export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ githubLinked?: string; githubError?: string; panel?: string }>;
}) {
  const { githubLinked, githubError, panel } = await searchParams;
  const userId = await getUserId();
  const [categoryRows, currency, user, walletRows, activitiesDefaultWalletId] = await Promise.all([
    listCategories(userId),
    getCurrency(userId),
    getUserById(userId),
    listWallets(userId, { includeArchived: true }),
    getActivitiesDefaultWalletId(userId),
  ]);
  const categories: CategoryOption[] = categoryRows.map((c) => ({
    id: c.id,
    type: isTransactionType(c.type) ? c.type : "expense",
    name: c.name,
    color: c.color,
    icon: c.icon,
  }));
  const wallets: WalletOption[] = walletRows.map(toWalletOption);

  return (
    <SettingsView
      categories={categories}
      currency={currency}
      username={user?.username ?? ""}
      email={user?.email ?? null}
      wallets={wallets}
      activitiesDefaultWalletId={activitiesDefaultWalletId}
      githubLinked={githubLinked === "1"}
      githubError={githubError}
      initialPanel={panel && isPanel(panel) ? panel : undefined}
    />
  );
}
