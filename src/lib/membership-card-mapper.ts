import { isMembershipCodeFormat } from "@/lib/memberships";
import { isCategoryIconKey } from "@/lib/category-icons";
import {
  isPassKind,
  normalizePassFields,
  normalizePassLayout,
  normalizeCustomFieldLabels,
  normalizeHiddenFieldLabels,
} from "@/lib/membership-templates";
import { parseCardBackground } from "@/lib/card-backgrounds";
import type { MembershipCard } from "@/types/membership";
import type { PassTemplateOption } from "@/types/pass-template";
import type { PassTemplateRow } from "@/lib/db";

// The snake_case shape both the server's listMembershipCards (db.ts) and
// the API routes' JSON responses share — used server-side (page.tsx) and
// client-side (after a fetch) alike, so this mapping is written once.
export type MembershipCardApiRow = {
  id: number;
  name: string;
  code_value: string;
  code_format: string;
  color: string;
  icon: string | null;
  notes: string | null;
  kind: string;
  fields: string;
  layout: string | null;
  background: string | null;
  text_color: string | null;
  has_logo: boolean;
  has_banner: boolean;
  category: string;
  custom_field_labels: string;
  show_logo: boolean;
  show_name: boolean;
  hidden_field_labels: string;
  logo_updated_at: string | null;
  banner_updated_at: string | null;
};

// The GET /api/memberships/[id]/logo|banner URL never changed on a
// re-upload, so every caching layer between the server and the screen
// (the browser's own HTTP cache, the service worker's stale-while-
// revalidate cache in public/sw.js) had no way to tell a freshly re-
// cropped image apart from whatever was already sitting in cache — a
// page-side cache eviction (invalidateApiCache) reaches the service
// worker's own cache but can't reach the browser's native HTTP cache,
// which can keep serving old bytes for a URL it already fetched once
// under the old Cache-Control regardless. Appending the stored
// logo/banner_updated_at timestamp makes a re-uploaded image a
// genuinely different URL every time, which sidesteps needing to reason
// about any caching layer at all — every one of them already treats an
// unseen URL as, correctly, something to fetch fresh. `updatedAt` null
// (an image uploaded before this existed) just omits the query entirely.
export function membershipImageUrl(cardId: number, kind: "logo" | "banner", updatedAt: string | null): string {
  const base = `/api/memberships/${cardId}/${kind}`;
  return updatedAt ? `${base}?v=${encodeURIComponent(updatedAt)}` : base;
}

export function toMembershipCard(row: MembershipCardApiRow): MembershipCard {
  const kind = isPassKind(row.kind) ? row.kind : "generic";
  let parsedFields: unknown = null;
  try {
    parsedFields = JSON.parse(row.fields);
  } catch {
    parsedFields = null;
  }
  let parsedLayout: unknown = null;
  try {
    parsedLayout = row.layout ? JSON.parse(row.layout) : null;
  } catch {
    parsedLayout = null;
  }
  let parsedCustomFieldLabels: unknown = null;
  try {
    parsedCustomFieldLabels = JSON.parse(row.custom_field_labels);
  } catch {
    parsedCustomFieldLabels = null;
  }
  const customFieldLabels = normalizeCustomFieldLabels(parsedCustomFieldLabels);
  let parsedHiddenFieldLabels: unknown = null;
  try {
    parsedHiddenFieldLabels = JSON.parse(row.hidden_field_labels);
  } catch {
    parsedHiddenFieldLabels = null;
  }
  return {
    id: row.id,
    name: row.name,
    codeValue: row.code_value,
    codeFormat: isMembershipCodeFormat(row.code_format) ? row.code_format : "qr",
    color: row.color,
    icon: row.icon && isCategoryIconKey(row.icon) ? row.icon : null,
    notes: row.notes,
    kind,
    fields: normalizePassFields(parsedFields),
    // Custom field keys are just as valid a layout slot as the kind's own
    // — see normalizePassLayout's customKeys param.
    layout: row.layout ? normalizePassLayout(parsedLayout, kind, Object.keys(customFieldLabels)) : null,
    background: parseCardBackground(row.background),
    textColor: row.text_color,
    hasLogo: row.has_logo,
    hasBanner: row.has_banner,
    category: row.category === "pass" ? "pass" : "membership",
    customFieldLabels,
    showLogo: row.show_logo,
    showName: row.show_name,
    hiddenFieldLabels: normalizeHiddenFieldLabels(parsedHiddenFieldLabels),
    logoUpdatedAt: row.logo_updated_at,
    bannerUpdatedAt: row.banner_updated_at,
  };
}

// pass_templates row -> PassTemplateOption — same shape-narrowing idea as
// toMembershipCard above (an unrecognized/stale kind value falls back to
// "generic" rather than the whole option failing to render).
export function toPassTemplateOption(row: PassTemplateRow): PassTemplateOption {
  return {
    id: row.id,
    name: row.name,
    kind: isPassKind(row.kind) ? row.kind : "generic",
    color: row.color,
    background: parseCardBackground(row.background),
    textColor: row.text_color,
    lockTextColor: row.lock_text_color,
    forceShowName: row.force_show_name,
    forceShowLogo: row.force_show_logo,
    country: row.country,
    status: row.status,
    submittedByUsername: row.submitted_by_username,
    createdAt: row.created_at,
  };
}
