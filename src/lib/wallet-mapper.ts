import type { WalletRow } from "@/lib/db";
import type { WalletOption } from "@/types/wallet";
import { isWalletKind } from "@/lib/wallets";
import { isCardNetwork } from "@/lib/wallet-cards";
import { parseCardBackground } from "@/lib/card-backgrounds";
import { isChipColor, DEFAULT_CHIP_COLOR } from "@/lib/chip-colors";
import { isBadgePosition, DEFAULT_BADGE_POSITION } from "@/lib/badge-position";
import { isChipPosition, DEFAULT_CHIP_POSITION } from "@/lib/chip-position";

// Every server page that lists wallets (Activities, Analytics, Settings,
// the Wallet page itself) maps the raw DB row the same way — pulled out
// here once so the four call sites can't quietly drift out of sync with
// each other, which is exactly how the payment-card-visual fields almost
// got missed in three of the four when wallets absorbed wallet_cards.
export function toWalletOption(w: WalletRow): WalletOption {
  return {
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
    holderName: w.holder_name,
    last4: w.last4,
    expiryMonth: w.expiry_month,
    expiryYear: w.expiry_year,
    network: w.network && isCardNetwork(w.network) ? w.network : null,
    showNetworkBadge: w.show_network_badge,
    badgePosition: isBadgePosition(w.badge_position) ? w.badge_position : DEFAULT_BADGE_POSITION,
    iconColor: w.icon_color,
    showChip: w.show_chip,
    chipColor: isChipColor(w.chip_color) ? w.chip_color : DEFAULT_CHIP_COLOR,
    chipPosition: isChipPosition(w.chip_position) ? w.chip_position : DEFAULT_CHIP_POSITION,
    notes: w.notes,
    showBalance: w.show_balance,
    showCurrency: w.show_currency,
  };
}
