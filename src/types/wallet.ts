import type { WalletKind } from "@/lib/wallets";
import type { CardBackground } from "@/lib/card-backgrounds";
import type { CardNetwork } from "@/lib/wallet-cards";
import type { ChipColor } from "@/lib/chip-colors";
import type { BadgePosition } from "@/lib/badge-position";
import type { ChipPosition } from "@/lib/chip-position";
import type { NamePosition } from "@/lib/name-position";
import type { CardNumberPosition } from "@/lib/card-number-position";
import type { CardTemplateCategory } from "@/lib/card-template-category";

export type WalletOption = {
  id: number;
  name: string;
  color: string;
  /** Optional pattern/gradient background — null means "plain `color` gradient". */
  background: CardBackground | null;
  /** Manual text-color override — null means auto-contrast against the background. */
  textColor: string | null;
  kind: WalletKind;
  /** Null means "use the app's default currency" — a display label only, amounts aren't converted. */
  currency: string | null;
  isDefault: boolean;
  archived: boolean;
  balance: number;
  /** False for a wallet shared with this account (see wallet_members) —
   * management actions (archive, delete, rename, invite another member)
   * are only offered when true; viewing/posting works either way. */
  isOwner: boolean;
  // Payment-card visuals — folded in from the old standalone wallet-cards
  // feature, so any wallet can optionally *also* look like a payment card
  // rather than accounts and cards being two separate lists. `network`
  // null means "no card look", i.e. render as a plain account
  // (AccountCardShape); non-null renders WalletCardShape instead.
  holderName: string | null;
  last4: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  network: CardNetwork | null;
  showNetworkBadge: boolean;
  badgePosition: BadgePosition;
  /** Manual network-badge/icon color override — see WalletCardShape.tsx. */
  iconColor: string | null;
  showChip: boolean;
  chipColor: ChipColor;
  chipPosition: ChipPosition;
  notes: string | null;
  /** Whether the balance amount renders on the card face — independent of
   * whether the wallet has a card look at all. */
  showBalance: boolean;
  /** Whether the currency shows/is selectable on the card face. */
  showCurrency: boolean;
  /** Whether the masked "•••• •••• •••• 1234" card-number row shows at all. */
  showCardNumber: boolean;
  /** Whether the wallet's name renders on the card face at all. */
  showName: boolean;
  /** Whether the holder-name text (bottom-left of the card) renders at all. */
  showHolderName: boolean;
  /** Whether the expiry date (bottom-right of the card) renders at all —
   * only matters when both expiryMonth and expiryYear are set. */
  showExpiry: boolean;
  /** Which corner the holder-name text sits in — see name-position.ts. */
  namePosition: NamePosition;
  /** Where the masked card-number row sits — see card-number-position.ts. */
  cardNumberPosition: CardNumberPosition;
  /** Whether the card-number row shows just the bare last4 digits instead
   * of the full masked "•••• •••• •••• 1234" row. */
  cardNumberLast4Only: boolean;
  /** What kind of real-world card this wallet is — null if uncategorized.
   * Same enum as card_templates.category, see card-template-category.ts.
   * Metadata only, never applied automatically. */
  category: CardTemplateCategory | null;
};
