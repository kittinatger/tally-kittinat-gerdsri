import type { CardBackground } from "@/lib/card-backgrounds";
import type { CardOrientation } from "@/lib/card-orientation";

// A user-submitted "premade card" design — see card_templates in db.ts.
// Purely the visual skin (background + colors); a picker applies these
// three fields onto whatever wallet is currently being edited.
export type CardTemplateOption = {
  id: number;
  name: string;
  color: string;
  background: CardBackground | null;
  textColor: string | null;
  // Optional author-forced overrides for the picking user's per-face
  // toggles — null means "leave whatever the wallet already has", so a
  // template that only ever sets a background/color never touches these.
  forceShowName: boolean | null;
  forceShowNetworkBadge: boolean | null;
  forceShowChip: boolean | null;
  forceShowCardNumber: boolean | null;
  forceShowBalance: boolean | null;
  forceShowCurrency: boolean | null;
  /** Which currency code to force the wallet itself onto — distinct from
   * forceShowCurrency above (whether it renders at all, not which one). */
  forceCurrency: string | null;
  /** Plain field (not a force_* override) — a template's orientation is
   * inherent to its own artwork, same as its background/color. */
  orientation: CardOrientation;
  status: "pending" | "approved" | "rejected";
  submittedByUsername: string | null;
  createdAt: string;
};
