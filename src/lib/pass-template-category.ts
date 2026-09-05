import type { MessageKey } from "@/lib/i18n/messages";

// What kind of real-world program a premade pass template represents —
// lets PremadePassPicker group an increasingly long list by category
// instead of by country. Deliberately a different axis from PassKind
// (membership-templates.ts): kind is the pass's *structural* shape
// (store card vs. boarding pass vs. coupon — which fields it has), while
// category is the *industry* the design is actually for (an airline's
// boarding pass and an airline's loyalty card are different kinds but the
// same category) — a fixed enum for the same reason CardTemplateCategory
// is: this is a small, well-known set, not something worth letting
// submitters spell however they like.
export const PASS_TEMPLATE_CATEGORIES = ["airline", "hotel", "retail", "dining", "transit", "entertainment", "other"] as const;

export type PassTemplateCategory = (typeof PASS_TEMPLATE_CATEGORIES)[number];

export function isPassTemplateCategory(value: string): value is PassTemplateCategory {
  return (PASS_TEMPLATE_CATEGORIES as readonly string[]).includes(value);
}

export const PASS_TEMPLATE_CATEGORY_LABEL_KEYS: Record<PassTemplateCategory, MessageKey> = {
  airline: "membership.passCategoryAirline",
  hotel: "membership.passCategoryHotel",
  retail: "membership.passCategoryRetail",
  dining: "membership.passCategoryDining",
  transit: "membership.passCategoryTransit",
  entertainment: "membership.passCategoryEntertainment",
  other: "membership.passCategoryOther",
};
