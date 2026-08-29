import { listWallets, getActivitiesDefaultWalletId, listMembershipCards } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { toWalletOption } from "@/lib/wallet-mapper";
import { toMembershipCard } from "@/lib/membership-card-mapper";
import WalletPageView from "@/components/WalletPageView";
import type { WalletOption } from "@/types/wallet";

// Always render fresh, same reasoning as the dashboard/activities pages.
export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const userId = await getUserId();
  const [walletRows, activitiesDefaultWalletId, membershipRows] = await Promise.all([
    listWallets(userId, { includeArchived: true }),
    getActivitiesDefaultWalletId(userId),
    listMembershipCards(userId),
  ]);

  // Accounts and payment cards are now one list — a wallet with `network`
  // set renders with a payment-card look (WalletCardShape), one without
  // renders as a plain account (AccountCardShape). See toWalletOption and
  // the wallets migration comments in db.ts for how the old standalone
  // wallet-cards feature folded in here.
  const wallets: WalletOption[] = walletRows.map(toWalletOption);

  const membershipCards = membershipRows.map(toMembershipCard);

  return (
    <WalletPageView
      wallets={wallets}
      activitiesDefaultWalletId={activitiesDefaultWalletId}
      passes={membershipCards.filter((c) => c.category === "pass")}
      memberships={membershipCards.filter((c) => c.category === "membership")}
    />
  );
}
