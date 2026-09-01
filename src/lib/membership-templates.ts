import type { MessageKey } from "@/lib/i18n/messages";

export const PASS_TEMPLATES = ["generic", "storeCard", "coupon", "eventTicket", "boardingPass"] as const;
export type PassTemplate = (typeof PASS_TEMPLATES)[number];

export function isPassTemplate(value: string): value is PassTemplate {
  return (PASS_TEMPLATES as readonly string[]).includes(value);
}

export const TEMPLATE_LABEL_KEYS: Record<PassTemplate, MessageKey> = {
  generic: "membership.templateGeneric",
  storeCard: "membership.templateStoreCard",
  coupon: "membership.templateCoupon",
  eventTicket: "membership.templateEventTicket",
  boardingPass: "membership.templateBoardingPass",
};

// PassKit-style zones: header sits beside the name/icon, primary is the
// single big field a pass is "about" (a discount, a route), secondary/
// auxiliary are smaller supporting fields. Only coupon/eventTicket/
// boardingPass get a "primary" field — see PassShape.tsx for why those
// three (and only those three) get the notch-divider stub treatment.
export type PassZone = "header" | "primary" | "secondary" | "auxiliary";
export const PASS_ZONES: readonly PassZone[] = ["header", "primary", "secondary", "auxiliary"];

export type PassFieldDef = {
  key: string;
  zone: PassZone;
  labelKey: MessageKey;
  placeholderKey: MessageKey;
};

// Only the fields relevant to each template — deliberately not a shared
// field set reskinned. Kept short (2-5 fields) so adding a card stays a
// quick flow rather than filling out a full PassKit pass.json.
export const TEMPLATE_FIELDS: Record<PassTemplate, PassFieldDef[]> = {
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
};

// Templates whose pass gets the notch-divider "stub" treatment in
// PassShape — the ones a real person would picture as having a tear-off
// part (a ticket, a boarding pass, a coupon), vs. a plain card.
export const STUB_TEMPLATES: readonly PassTemplate[] = ["coupon", "eventTicket", "boardingPass"];

export type PassLayout = Record<PassZone, (string | null)[]>;

// What renders when a card has no custom `layout` — each zone's fields,
// in TEMPLATE_FIELDS order, one slot per field.
export function defaultLayoutFor(template: PassTemplate): PassLayout {
  const layout: PassLayout = { header: [], primary: [], secondary: [], auxiliary: [] };
  for (const field of TEMPLATE_FIELDS[template]) {
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
// to the template's default layout rather than an empty/broken canvas.
export function normalizePassLayout(raw: unknown, template: PassTemplate): PassLayout {
  if (typeof raw !== "object" || raw === null) return defaultLayoutFor(template);
  const validKeys = new Set(TEMPLATE_FIELDS[template].map((f) => f.key));
  const result: PassLayout = { header: [], primary: [], secondary: [], auxiliary: [] };
  let any = false;
  for (const zone of PASS_ZONES) {
    const slots = (raw as Record<string, unknown>)[zone];
    if (!Array.isArray(slots)) continue;
    result[zone] = slots.map((v) => (typeof v === "string" && validKeys.has(v) ? v : null));
    any = true;
  }
  return any ? result : defaultLayoutFor(template);
}
