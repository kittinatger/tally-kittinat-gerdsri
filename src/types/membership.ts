import type { MembershipCodeFormat } from "@/lib/memberships";
import type { CategoryIconKey } from "@/lib/category-icons";
import type { PassKind, PassLayout } from "@/lib/membership-templates";
import type { CardBackground } from "@/lib/card-backgrounds";

export type MembershipCard = {
  id: number;
  name: string;
  codeValue: string;
  codeFormat: MembershipCodeFormat;
  color: string;
  /** Optional pattern/gradient background — null means "plain `color` gradient". */
  background: CardBackground | null;
  /** Manual text-color override — null means auto-contrast against the background. */
  textColor: string | null;
  icon: CategoryIconKey | null;
  notes: string | null;
  /** Which shape of pass this is (boarding pass, coupon, loyalty card,
   * ...) — fixed for the card's lifetime, distinct from a *premade
   * design* someone can pick from (see PassTemplateOption/
   * PremadePassPicker). Called "kind" rather than "template" specifically
   * to avoid that confusion. */
  kind: PassKind;
  fields: Record<string, string>;
  /** Null means "use the kind's default layout" — see defaultLayoutFor. */
  layout: PassLayout | null;
  /** Whether an image is stored at /api/memberships/[id]/logo|banner. */
  hasLogo: boolean;
  hasBanner: boolean;
  /** Bumped on every (re)upload, null until the first one — build the
   * actual URL via membershipImageUrl (membership-card-mapper.ts) rather
   * than the bare path, so a re-cropped image isn't served stale out of
   * the browser's or service worker's cache under the old URL. */
  logoUpdatedAt: string | null;
  bannerUpdatedAt: string | null;
  /** Whether the human-readable code value shows alongside the code
   * itself — purely cosmetic, the code still scans identically either
   * way. See MembershipCardCode's showText prop. */
  showCodeText: boolean;
  /** Which tab on the /wallet page this card lives in. */
  category: "pass" | "membership";
  /** User-named fields (key -> plain-text label) beyond the current
   * kind's own fixed set — placed into layout zones the same way as one
   * of the kind's own fields, but with a label the user typed themselves
   * instead of an i18n key. See MAX_CUSTOM_FIELDS in membership-templates.ts. */
  customFieldLabels: Record<string, string>;
  /** Whether the header's logo/icon avatar and name text show on the card
   * face — independent of whether a logo image is actually attached or
   * the name itself, so either can be hidden without deleting either. */
  showLogo: boolean;
  showName: boolean;
  /** Field keys (kind-defined or custom) whose small uppercase label is
   * suppressed on the card face — only the value shows. Purely a display
   * toggle; the field's value and layout placement are untouched. */
  hiddenFieldLabels: string[];
};
