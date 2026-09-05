import type { MessageKey } from "@/lib/i18n/messages";

// Called "kind" (not "template") deliberately — this is which shape of
// pass a card is (a boarding pass vs. a coupon vs. a loyalty card), fixed
// for the card's whole lifetime. It used to be named PassTemplate/
// PASS_TEMPLATES, which read as the same thing as the *actual* templates
// feature (pass_templates in db.ts / PremadePassPicker — admin-reviewed
// premade designs a user can pick from). Two unrelated concepts sharing
// the word "template" was a real source of confusion once both existed
// side by side, so this one was renamed to "kind" instead.
export const PASS_KINDS = ["generic", "storeCard", "coupon", "eventTicket", "boardingPass", "giftCard", "transitPass"] as const;
export type PassKind = (typeof PASS_KINDS)[number];

export function isPassKind(value: string): value is PassKind {
  return (PASS_KINDS as readonly string[]).includes(value);
}

export const KIND_LABEL_KEYS: Record<PassKind, MessageKey> = {
  generic: "membership.templateGeneric",
  storeCard: "membership.templateStoreCard",
  coupon: "membership.templateCoupon",
  eventTicket: "membership.templateEventTicket",
  boardingPass: "membership.templateBoardingPass",
  giftCard: "membership.templateGiftCard",
  transitPass: "membership.templateTransitPass",
};

// PassKit-style zones: header sits beside the name/icon, primary is the
// single big field a pass is "about" (a discount, a route), secondary/
// auxiliary are smaller supporting fields. Only coupon/eventTicket/
// boardingPass/transitPass get a "primary" field — see PassShape.tsx for
// why those (and only those) get the notch-divider stub treatment.
export type PassZone = "header" | "primary" | "secondary" | "auxiliary";
export const PASS_ZONES: readonly PassZone[] = ["header", "primary", "secondary", "auxiliary"];

export type PassFieldDef = {
  key: string;
  zone: PassZone;
  labelKey: MessageKey;
  placeholderKey: MessageKey;
};

// Only the fields relevant to each kind — deliberately not a shared field
// set reskinned. Kept short (2-5 fields) so adding a card stays a quick
// flow rather than filling out a full PassKit pass.json.
export const KIND_FIELDS: Record<PassKind, PassFieldDef[]> = {
  generic: [
    { key: "memberId", zone: "secondary", labelKey: "membership.fieldMemberId", placeholderKey: "membership.fieldMemberIdPlaceholder" },
    { key: "memberSince", zone: "auxiliary", labelKey: "membership.fieldMemberSince", placeholderKey: "membership.fieldMemberSincePlaceholder" },
    { key: "expiry", zone: "auxiliary", labelKey: "membership.fieldExpiry", placeholderKey: "membership.fieldExpiryPlaceholder" },
  ],
  storeCard: [
    { key: "pointsBalance", zone: "secondary", labelKey: "membership.fieldPointsBalance", placeholderKey: "membership.fieldPointsBalancePlaceholder" },
    { key: "memberSince", zone: "auxiliary", labelKey: "membership.fieldMemberSince", placeholderKey: "membership.fieldMemberSincePlaceholder" },
  ],
  coupon: [
    { key: "discount", zone: "primary", labelKey: "membership.fieldDiscount", placeholderKey: "membership.fieldDiscountPlaceholder" },
    { key: "expiry", zone: "secondary", labelKey: "membership.fieldExpiry", placeholderKey: "membership.fieldExpiryPlaceholder" },
  ],
  eventTicket: [
    { key: "eventDate", zone: "secondary", labelKey: "membership.fieldEventDate", placeholderKey: "membership.fieldEventDatePlaceholder" },
    { key: "venue", zone: "secondary", labelKey: "membership.fieldVenue", placeholderKey: "membership.fieldVenuePlaceholder" },
    { key: "seat", zone: "auxiliary", labelKey: "membership.fieldSeat", placeholderKey: "membership.fieldSeatPlaceholder" },
  ],
  boardingPass: [
    { key: "fromCode", zone: "header", labelKey: "membership.fieldFrom", placeholderKey: "membership.fieldFromPlaceholder" },
    { key: "toCode", zone: "header", labelKey: "membership.fieldTo", placeholderKey: "membership.fieldToPlaceholder" },
    { key: "gate", zone: "auxiliary", labelKey: "membership.fieldGate", placeholderKey: "membership.fieldGatePlaceholder" },
    { key: "seat", zone: "auxiliary", labelKey: "membership.fieldSeat", placeholderKey: "membership.fieldSeatPlaceholder" },
    { key: "boardingTime", zone: "auxiliary", labelKey: "membership.fieldBoardingTime", placeholderKey: "membership.fieldBoardingTimePlaceholder" },
  ],
  // A stored-value card (a retailer gift card, not a points/loyalty
  // balance) — the "primary" field is the remaining balance itself, same
  // treatment as coupon's discount, since that's the one number the whole
  // card is about.
  giftCard: [
    { key: "balance", zone: "primary", labelKey: "membership.fieldBalance", placeholderKey: "membership.fieldBalancePlaceholder" },
    { key: "expiry", zone: "secondary", labelKey: "membership.fieldExpiry", placeholderKey: "membership.fieldExpiryPlaceholder" },
  ],
  // A transit/rides pass (a subway card, a bus pass) — ridesRemaining as
  // the primary field, same "one number this card is about" idea, plus
  // the tear-off stub treatment a physical transit ticket actually has.
  transitPass: [
    { key: "ridesRemaining", zone: "primary", labelKey: "membership.fieldRidesRemaining", placeholderKey: "membership.fieldRidesRemainingPlaceholder" },
    { key: "expiry", zone: "secondary", labelKey: "membership.fieldExpiry", placeholderKey: "membership.fieldExpiryPlaceholder" },
  ],
};

// Kinds whose pass gets the notch-divider "stub" treatment in PassShape —
// the ones a real person would picture as having a tear-off part (a
// ticket, a boarding pass, a coupon, a transit ticket), vs. a plain card.
export const STUB_KINDS: readonly PassKind[] = ["coupon", "eventTicket", "boardingPass", "transitPass"];

export type PassLayout = Record<PassZone, (string | null)[]>;

// What renders when a card has no custom `layout` — each zone's fields,
// in KIND_FIELDS order, one slot per field.
export function defaultLayoutFor(kind: PassKind): PassLayout {
  const layout: PassLayout = { header: [], primary: [], secondary: [], auxiliary: [] };
  for (const field of KIND_FIELDS[kind]) {
    layout[field.zone].push(field.key);
  }
  return layout;
}

// Tolerant parse for the `fields` TEXT column (stored as JSON, same
// pattern as app_settings.dashboard_widgets) — never throws, drops
// anything that isn't a flat string-to-string map.
export function normalizePassFields(raw: unknown): Record<string, string> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") result[k] = v;
  }
  return result;
}

// Tolerant parse for the `layout` TEXT column — null/malformed falls back
// to the kind's default layout rather than an empty/broken canvas.
// `customKeys` are the card's own user-named custom fields (see
// normalizeCustomFieldLabels below) — a placed custom field's key is just
// as valid a layout slot as one of the kind's own, so it's accepted
// alongside KIND_FIELDS[kind] rather than getting silently stripped out
// as unrecognized.
export function normalizePassLayout(raw: unknown, kind: PassKind, customKeys: Iterable<string> = []): PassLayout {
  if (typeof raw !== "object" || raw === null) return defaultLayoutFor(kind);
  const validKeys = new Set([...KIND_FIELDS[kind].map((f) => f.key), ...customKeys]);
  const result: PassLayout = { header: [], primary: [], secondary: [], auxiliary: [] };
  let any = false;
  for (const zone of PASS_ZONES) {
    const slots = (raw as Record<string, unknown>)[zone];
    if (!Array.isArray(slots)) continue;
    result[zone] = slots.map((v) => (typeof v === "string" && validKeys.has(v) ? v : null));
    any = true;
  }
  return any ? result : defaultLayoutFor(kind);
}

// A pass can only have this many user-named custom fields — same
// "kept short" reasoning as KIND_FIELDS itself: this is meant to stay a
// quick flow, not a full PassKit pass.json editor.
export const MAX_CUSTOM_FIELDS = 10;

// Tolerant parse for the `custom_field_labels` TEXT column — same shape
// and defensiveness as normalizePassFields, plus the count/length caps
// validation.ts's schema also enforces server-side (this is the client-
// facing mirror, used when reading a card back rather than saving one).
export function normalizeCustomFieldLabels(raw: unknown): Record<string, string> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (Object.keys(result).length >= MAX_CUSTOM_FIELDS) break;
    if (typeof v === "string" && v.trim()) result[k] = v.trim().slice(0, 40);
  }
  return result;
}
