import type { MembershipCodeFormat } from "@/lib/memberships";
import type { CategoryIconKey } from "@/lib/category-icons";

export type MembershipCard = {
  id: number;
  name: string;
  codeValue: string;
  codeFormat: MembershipCodeFormat;
  color: string;
  icon: CategoryIconKey | null;
  notes: string | null;
};
