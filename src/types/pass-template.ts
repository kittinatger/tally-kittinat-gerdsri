import type { CardBackground } from "@/lib/card-backgrounds";
import type { PassTemplate } from "@/lib/membership-templates";

// A user-submitted "premade pass" design — see pass_templates in db.ts.
// The visual skin (background + colors) plus a couple of force_show_*
// overrides, tied to a fixed `template` since a pass's fields are
// structurally dependent on which one it is (a boarding pass's FROM/TO vs.
// a coupon's discount) — unlike a wallet card template, there's no
// "category" left as freely optional metadata here.
export type PassTemplateOption = {
  id: number;
  name: string;
  template: PassTemplate;
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
  /** Which country this template is grouped under in PremadePassPicker —
   * null lands it in an "Other" bucket. Metadata only. */
  country: string | null;
  status: "pending" | "approved" | "rejected";
  submittedByUsername: string | null;
  createdAt: string;
};
