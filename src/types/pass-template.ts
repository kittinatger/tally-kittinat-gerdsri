import type { CardBackground } from "@/lib/card-backgrounds";
import type { PassKind } from "@/lib/membership-templates";
import type { PassTemplateCategory } from "@/lib/pass-template-category";

// A user-submitted "premade pass" design — see pass_templates in db.ts.
// The visual skin (background + colors) plus a couple of force_show_*
// overrides, tied to a fixed `kind` since a pass's fields are structurally
// dependent on which one it is (a boarding pass's FROM/TO vs. a coupon's
// discount).
export type PassTemplateOption = {
  id: number;
  name: string;
  kind: PassKind;
  color: string;
  background: CardBackground | null;
  textColor: string | null;
  // When true, the picker's text-color control is locked to textColor
  // above rather than just starting from it.
  lockTextColor: boolean;
  // Optional author-forced overrides for the picking pass's showLogo/
  // showName toggles — null means "leave whatever the pass already has".
  forceShowName: boolean | null;
  forceShowLogo: boolean | null;
  /** Which industry/program category this design represents (airline,
   * hotel, retail, ...) — groups PremadePassPicker's gallery; null lands
   * it in an "Other" bucket. See pass-template-category.ts. Metadata
   * only, never applied to the picking pass. */
  category: PassTemplateCategory | null;
  status: "pending" | "approved" | "rejected";
  submittedByUsername: string | null;
  createdAt: string;
};
