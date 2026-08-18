import type { MembershipCodeFormat } from "@/lib/memberships";
import type { CategoryIconKey } from "@/lib/category-icons";
import type { PassTemplate, PassLayout } from "@/lib/membership-templates";

export type MembershipCard = {
  id: number;
  name: string;
  codeValue: string;
  codeFormat: MembershipCodeFormat;
  color: string;
  icon: CategoryIconKey | null;
  notes: string | null;
  template: PassTemplate;
  fields: Record<string, string>;
  /** Null means "use the template's default layout" — see defaultLayoutFor. */
  layout: PassLayout | null;
  /** Whether an image is stored at /api/memberships/[id]/logo|banner. */
  hasLogo: boolean;
  hasBanner: boolean;
};
