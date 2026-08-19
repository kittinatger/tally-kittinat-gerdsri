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
};
