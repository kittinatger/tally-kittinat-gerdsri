// Category icon keys — each maps to a line-icon component in @/lib/icons
// (CATEGORY_ICON_COMPONENTS). Kept in a plain .ts module (no JSX) so
// validation.ts can import the key list for its zod schema without pulling
// React into server-only code.
import type { MessageKey } from "@/lib/i18n/messages";

export const CATEGORY_ICON_KEYS = [
  "cart", "burger", "coffee", "car", "bus", "plane", "home", "bulb",
  "shield", "movie", "game", "book", "health", "pill", "beauty", "baby",
  "pet", "gift", "gradcap", "fitness", "art", "music", "phone", "receipt",
  "tool", "box", "shirt", "card", "cash", "bank", "chart", "wine",
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];

export const CATEGORY_ICON_LABELS: Record<CategoryIconKey, string> = {
  cart: "Shopping",
  burger: "Fast food",
  coffee: "Coffee",
  car: "Car",
  bus: "Transit",
  plane: "Travel",
  home: "Housing",
  bulb: "Utilities",
  shield: "Insurance",
  movie: "Movies",
  game: "Gaming",
  book: "Reading",
  health: "Health",
  pill: "Pharmacy",
  beauty: "Beauty",
  baby: "Childcare",
  pet: "Pets",
  gift: "Gifts",
  gradcap: "Education",
  fitness: "Fitness",
  art: "Hobbies",
  music: "Music",
  phone: "Phone",
  receipt: "Bills",
  tool: "Repairs",
  box: "Packages",
  shirt: "Clothing",
  card: "Card fees",
  cash: "Cash",
  bank: "Banking",
  chart: "Investing",
  wine: "Bar",
};

export function isCategoryIconKey(value: string): value is CategoryIconKey {
  return (CATEGORY_ICON_KEYS as readonly string[]).includes(value);
}

// Translation keys for each icon's label — kept separate from the plain
// CATEGORY_ICON_LABELS map above (this module has no JSX/hooks, so the
// actual translated strings are built at render time via t() in
// CategoryModal using this lookup table). See MessageKey in
// @/lib/i18n/messages for the "category.icon.*" entries.
export const CATEGORY_ICON_LABEL_KEYS: Record<CategoryIconKey, MessageKey> = {
  cart: "category.icon.cart",
  burger: "category.icon.burger",
  coffee: "category.icon.coffee",
  car: "category.icon.car",
  bus: "category.icon.bus",
  plane: "category.icon.plane",
  home: "category.icon.home",
  bulb: "category.icon.bulb",
  shield: "category.icon.shield",
  movie: "category.icon.movie",
  game: "category.icon.game",
  book: "category.icon.book",
  health: "category.icon.health",
  pill: "category.icon.pill",
  beauty: "category.icon.beauty",
  baby: "category.icon.baby",
  pet: "category.icon.pet",
  gift: "category.icon.gift",
  gradcap: "category.icon.gradcap",
  fitness: "category.icon.fitness",
  art: "category.icon.art",
  music: "category.icon.music",
  phone: "category.icon.phone",
  receipt: "category.icon.receipt",
  tool: "category.icon.tool",
  box: "category.icon.box",
  shirt: "category.icon.shirt",
  card: "category.icon.card",
  cash: "category.icon.cash",
  bank: "category.icon.bank",
  chart: "category.icon.chart",
  wine: "category.icon.wine",
};
