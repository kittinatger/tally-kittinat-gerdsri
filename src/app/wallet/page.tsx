import { listWallets, getActivitiesDefaultWalletId, listWalletCards, listMembershipCards } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { isWalletKind } from "@/lib/wallets";
import { isCardNetwork } from "@/lib/wallet-cards";
import { parseCardBackground } from "@/lib/card-backgrounds";
import { toMembershipCard } from "@/lib/membership-card-mapper";
import WalletPageView from "@/components/WalletPageView";
import type { WalletOption } from "@/types/wallet";
import type { WalletCard } from "@/types/wallet-card";

// Always render fresh, same reasoning as the dashboard/activities pages.
export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const userId = await getUserId();
  const [walletRows, activitiesDefaultWalletId, walletCardRows, membershipRows] = await Promise.all([
    listWallets(userId, { includeArchived: true }),
    getActivitiesDefaultWalletId(userId),
    listWalletCards(userId),
    listMembershipCards(userId),
  ]);

  const wallets: WalletOption[] = walletRows.map((w) => ({
    id: w.id,
    name: w.name,
    color: w.color,
    background: parseCardBackground(w.background),
    kind: isWalletKind(w.kind) ? w.kind : "cash",
    currency: w.currency,
    isDefault: w.is_default,
    archived: w.archived,
    balance: Number(w.balance),
  }));

  const walletCards: WalletCard[] = walletCardRows.map((c) => ({
    id: c.id,
    label: c.label,
    holderName: c.holder_name,
    last4: c.last4,
    expiryMonth: c.expiry_month,
    expiryYear: c.expiry_year,
    network: isCardNetwork(c.network) ? c.network : "other",
    color: c.color,
    background: parseCardBackground(c.background),
    notes: c.notes,
  }));

  const membershipCards = membershipRows.map(toMembershipCard);

  return (
    <WalletPageView
      wallets={wallets}
      activitiesDefaultWalletId={activitiesDefaultWalletId}
      walletCards={walletCards}
      passes={membershipCards.filter((c) => c.category === "pass")}
      memberships={membershipCards.filter((c) => c.category === "membership")}
    />
  );
}
