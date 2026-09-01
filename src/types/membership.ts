import type { MembershipCodeFormat } from "@/lib/memberships";
import type { CategoryIconKey } from "@/lib/category-icons";
import type { PassTemplate, PassLayout } from "@/lib/membership-templates";
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
  template: PassTemplate;
  fields: Record<string, string>;
  /** Null means "use the template's default layout" — see defaultLayoutFor. */
  layout: PassLayout | null;
  /** Whether an image is stored at /api/memberships/[id]/logo|banner. */
  hasLogo: boolean;
  hasBanner: boolean;
  /** Which tab on the /wallet page this card lives in. */
  category: "pass" | "membership";
  /** User-named fields (key -> plain-text label) beyond the current
   * template's own fixed set — placed into layout zones the same way as a
   * template field, but with a label the user typed themselves instead of
   * an i18n key. See MAX_CUSTOM_FIELDS in membership-templates.ts. */
  customFieldLabels: Record<string, string>;
};
