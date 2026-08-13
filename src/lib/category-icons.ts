// Category icon keys — each maps to a line-icon component in @/lib/icons
// (CATEGORY_ICON_COMPONENTS). Kept in a plain .ts module (no JSX) so
// validation.ts can import the key list for its zod schema without pulling
// React into server-only code.
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
