import { listWallets, getActivitiesDefaultWalletId, listWalletCards, listMembershipCards } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { isWalletKind } from "@/lib/wallets";
import { isCardNetwork } from "@/lib/wallet-cards";
import { parseCardBackground } from "@/lib/card-backgrounds";
import { isChipColor, DEFAULT_CHIP_COLOR } from "@/lib/chip-colors";
import { isBadgePosition, DEFAULT_BADGE_POSITION } from "@/lib/badge-position";
import { isChipPosition, DEFAULT_CHIP_POSITION } from "@/lib/chip-position";
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
    textColor: w.text_color,
    kind: isWalletKind(w.kind) ? w.kind : "cash",
    currency: w.currency,
    isDefault: w.is_default,
    archived: w.archived,
    balance: Number(w.balance),
    isOwner: w.is_owner,
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
    showNetworkBadge: c.show_network_badge,
    badgePosition: isBadgePosition(c.badge_position) ? c.badge_position : DEFAULT_BADGE_POSITION,
    textColor: c.text_color,
    showChip: c.show_chip,
    chipColor: isChipColor(c.chip_color) ? c.chip_color : DEFAULT_CHIP_COLOR,
    chipPosition: isChipPosition(c.chip_position) ? c.chip_position : DEFAULT_CHIP_POSITION,
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
