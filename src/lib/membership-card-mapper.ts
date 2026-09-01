import { isMembershipCodeFormat } from "@/lib/memberships";
import { isCategoryIconKey } from "@/lib/category-icons";
import {
  isPassTemplate,
  normalizePassFields,
  normalizePassLayout,
  normalizeCustomFieldLabels,
} from "@/lib/membership-templates";
import { parseCardBackground } from "@/lib/card-backgrounds";
import type { MembershipCard } from "@/types/membership";

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
  template: string;
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
};

export function toMembershipCard(row: MembershipCardApiRow): MembershipCard {
  const template = isPassTemplate(row.template) ? row.template : "generic";
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
  return {
    id: row.id,
    name: row.name,
    codeValue: row.code_value,
    codeFormat: isMembershipCodeFormat(row.code_format) ? row.code_format : "qr",
    color: row.color,
    icon: row.icon && isCategoryIconKey(row.icon) ? row.icon : null,
    notes: row.notes,
    template,
    fields: normalizePassFields(parsedFields),
    // Custom field keys are just as valid a layout slot as the template's
    // own — see normalizePassLayout's customKeys param.
    layout: row.layout ? normalizePassLayout(parsedLayout, template, Object.keys(customFieldLabels)) : null,
    background: parseCardBackground(row.background),
    textColor: row.text_color,
    hasLogo: row.has_logo,
    hasBanner: row.has_banner,
    category: row.category === "pass" ? "pass" : "membership",
    customFieldLabels,
    showLogo: row.show_logo,
    showName: row.show_name,
  };
}
