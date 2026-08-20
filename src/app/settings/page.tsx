import { listCategories, getCurrency, getUserById, listWallets, getRemaining, getActivitiesDefaultWalletId } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsView from "@/components/SettingsView";
import { isTransactionType } from "@/lib/categories";
import { isWalletKind } from "@/lib/wallets";
import { parseCardBackground } from "@/lib/card-backgrounds";
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
  const [categoryRows, currency, user, walletRows, remaining, activitiesDefaultWalletId] = await Promise.all([
    listCategories(userId),
    getCurrency(userId),
    getUserById(userId),
    listWallets(userId, { includeArchived: true }),
    getRemaining(userId),
    getActivitiesDefaultWalletId(userId),
  ]);
  const categories: CategoryOption[] = categoryRows.map((c) => ({
    id: c.id,
    type: isTransactionType(c.type) ? c.type : "expense",
    name: c.name,
    color: c.color,
    icon: c.icon,
  }));
  const wallets: WalletOption[] = walletRows.map((w) => ({
    id: w.id,
    name: w.name,
    color: w.color,
    background: parseCardBackground(w.background),
    textColor: w.text_color,
    kind: isWalletKind(w.kind) ? w.kind : "cash",
    currency: w.currency,
    isDefault: w.is_default,
    archived: w.archived,
    balance: Number(w.balance),
  }));

  return (
    <SettingsView
      categories={categories}
      currency={currency}
      username={user?.username ?? ""}
      email={user?.email ?? null}
      wallets={wallets}
      remaining={remaining}
      activitiesDefaultWalletId={activitiesDefaultWalletId}
      githubLinked={githubLinked === "1"}
      githubError={githubError}
      initialPanel={panel && isPanel(panel) ? panel : undefined}
    />
  );
}
