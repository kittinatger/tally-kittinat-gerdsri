import type { MessageKey } from "@/lib/i18n/messages";

// What kind of real-world card a premade card template represents — lets
// PremadeCardPicker filter an increasingly long, multi-country list by
// card type (a transit card and a credit card from the same country are
// otherwise indistinguishable in the gallery). Unlike country (free text,
// see currency-country.ts), this is a fixed enum — card "type" is a small,
// well-known set, not something worth letting submitters spell however
// they like.
export const CARD_TEMPLATE_CATEGORIES = ["eMoney", "creditCard", "debitCard", "transitCard", "idCard", "membership", "other"] as const;

export type CardTemplateCategory = (typeof CARD_TEMPLATE_CATEGORIES)[number];

export function isCardTemplateCategory(value: string): value is CardTemplateCategory {
  return (CARD_TEMPLATE_CATEGORIES as readonly string[]).includes(value);
}

export const CARD_TEMPLATE_CATEGORY_LABEL_KEYS: Record<CardTemplateCategory, MessageKey> = {
  eMoney: "wallet.templateCategoryEMoney",
  creditCard: "wallet.templateCategoryCreditCard",
  debitCard: "wallet.templateCategoryDebitCard",
  transitCard: "wallet.templateCategoryTransitCard",
  idCard: "wallet.templateCategoryIdCard",
  membership: "wallet.templateCategoryMembership",
  other: "wallet.templateCategoryOther",
};
