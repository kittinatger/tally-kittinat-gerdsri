import { z } from "zod";
import { TRANSACTION_TYPES, TRANSFER_DIRECTIONS } from "@/lib/categories";
import { WALLET_KINDS } from "@/lib/wallets";
import {
  DASHBOARD_WIDGET_TYPES,
  WIDGET_WIDTHS,
  SUMMARY_CARDS,
  WIDGET_ACCENTS,
  LIMIT_OPTIONS,
} from "@/lib/dashboard-widgets";
import { CHALLENGE_TYPES, CHALLENGE_MODES } from "@/lib/challenges";
import { SPLIT_METHODS, SPLIT_PAYMENT_METHODS } from "@/lib/splits";
import { LOAN_DIRECTIONS } from "@/lib/loans";
import { CATEGORY_ICON_KEYS } from "@/lib/category-icons";
import { MEMBERSHIP_CODE_FORMATS } from "@/lib/memberships";
import { PASS_TEMPLATES, PASS_ZONES, type PassZone } from "@/lib/membership-templates";
import { CARD_NETWORKS } from "@/lib/wallet-cards";
import { CARD_PATTERNS, PATTERN_COLOR_COUNT } from "@/lib/card-backgrounds";
import { CHIP_COLORS } from "@/lib/chip-colors";
import { BADGE_POSITIONS } from "@/lib/badge-position";
import { NAME_POSITIONS } from "@/lib/name-position";
import { CARD_TEMPLATE_CATEGORIES } from "@/lib/card-template-category";
import { CHIP_POSITIONS } from "@/lib/chip-position";
import { isLanguageCode } from "@/lib/languages";

// Shared by wallets and membership_cards' optional background
// pattern/gradient — see card-backgrounds.ts. Colors are always plain hex
// (never a named palette token), since these render as raw CSS gradients.
// Length isn't cross-checked against PATTERN_COLOR_COUNT here — a short
// array just means normalizeCardBackground pads it from that pattern's
// defaults, so a slightly-stale client payload never fails validation.
const cardPatternBackgroundSchema = z.object({
  pattern: z.enum(CARD_PATTERNS),
  colors: z
    .array(z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color"))
    .min(1)
    .max(Math.max(...Object.values(PATTERN_COLOR_COUNT))),
});
// A literal image background (the scanned photo used as-is, or an
// AI-generated pattern derived from it) — see the CardBackground union in
// card-backgrounds.ts for why both share this one shape. Capped well above
// what the app itself ever produces (a downscaled, JPEG-compressed data
// URL), just to bound how much a malicious payload could bloat the row.
const cardPhotoBackgroundSchema = z.object({
  pattern: z.literal("photo"),
  photoDataUrl: z
    .string()
    .trim()
    .regex(/^data:image\/[a-z0-9.+-]+;base64,/i, "Must be an image data URL")
    .max(2_000_000),
});
const cardBackgroundSchema = z.union([cardPatternBackgroundSchema, cardPhotoBackgroundSchema]).nullable();

// Shared by the same three entities' optional manual text-color override —
// see cardForegroundFor in card-backgrounds.ts. Null means "auto-contrast
// against the background", the default for every card before this existed.
const cardTextColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color")
  .nullable();

// Same shape as cardTextColorSchema, plus one extra sentinel: the wallet
// card badge/icon color can also be explicitly set to "original", meaning
// "render the network's real brand-color artwork, not a recolored mask" —
// see RECOLORABLE_BADGE_ASPECT in WalletCardShape.tsx.
const cardIconColorSchema = z
  .string()
  .trim()
  .refine((v) => v === "original" || /^#[0-9a-fA-F]{6}$/.test(v), 'Must be a 6-digit hex color or "original"')
  .nullable();

export const forgotPasswordInputSchema = z.object({
  email: z.string().trim().email().max(255),
});

export const resetPasswordInputSchema = z.object({
  token: z.string().trim().min(20).max(200),
  password: z.string().min(8).max(200),
});

const sharedFields = {
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  amount: z.number().positive().finite(),
  merchant: z.string().trim().min(1).max(200),
  // Categories are now user-editable (see the categories table), so this is
  // validated as free text here; API routes trust the value against
  // whatever categories currently exist rather than a fixed enum.
  category: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(500).nullable().optional(),
  walletId: z.number().int().positive().nullable().optional(),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(10)
    .optional()
    .transform((arr) => {
      if (!arr) return [];
      const seen = new Set<string>();
      const deduped: string[] = [];
      for (const tag of arr) {
        const key = tag.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(tag);
      }
      return deduped;
    }),
};

export const expenseInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("expense"), ...sharedFields }),
  z.object({ type: z.literal("income"), ...sharedFields }),
  z.object({ type: z.literal("transfer"), direction: z.enum(TRANSFER_DIRECTIONS), ...sharedFields }),
]);

export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export const settingsInputSchema = z
  .object({
    remaining: z.number().finite().optional(),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((v) => v.toUpperCase())
      .optional(),
    autoConvertCurrency: z.boolean().optional(),
    convertWalletBalances: z.boolean().optional(),
    notifyRecurringEmail: z.boolean().optional(),
    notifyBudgetEmail: z.boolean().optional(),
    notifyPushReminders: z.boolean().optional(),
    requireSplitConfirmation: z.boolean().optional(),
    language: z.string().refine(isLanguageCode, { message: "Unsupported language" }).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Provide at least one setting to update",
  });

export const activitiesDefaultWalletInputSchema = z.object({
  walletId: z.number().int().positive().nullable(),
});

export const DEFAULT_VIEWS = ["today", "week", "month", "all"] as const;
export const TIMEZONE_MODES = ["auto", "custom"] as const;

export const calendarSettingsInputSchema = z
  .object({
    weekStartDay: z.number().int().min(0).max(6).optional(),
    monthStartDay: z.number().int().min(1).max(28).optional(),
    biweeklyAnchorDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
      .nullable()
      .optional(),
    defaultView: z.enum(DEFAULT_VIEWS).optional(),
    timezone: z.string().trim().min(1).max(100).optional(),
    showWeekNumbers: z.boolean().optional(),
    alternateCalendar: z.string().trim().min(1).max(30).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Provide at least one calendar setting to update",
  });

const walletCurrencySchema = z
  .string()
  .trim()
  .length(3)
  .transform((v) => v.toUpperCase())
  .nullable();

// Payment-card visual fields, shared by both wallet schemas below — every
// wallet can now optionally also look like a payment card (network badge,
// chip, holder/last4/expiry), folded in from the old standalone
// wallet_cards feature. All optional: a plain account simply never sets
// `network`, and WalletCardShape isn't rendered for it.
const walletCardVisualFields = {
  holderName: z.string().trim().max(60).nullable().optional(),
  last4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Must be exactly 4 digits")
    .nullable()
    .optional(),
  expiryMonth: z.number().int().min(1).max(12).nullable().optional(),
  expiryYear: z.number().int().min(2000).max(2200).nullable().optional(),
  network: z.enum(CARD_NETWORKS).nullable().optional(),
  showNetworkBadge: z.boolean().optional(),
  badgePosition: z.enum(BADGE_POSITIONS).optional(),
  iconColor: cardIconColorSchema.optional(),
  showChip: z.boolean().optional(),
  chipColor: z.enum(CHIP_COLORS).optional(),
  chipPosition: z.enum(CHIP_POSITIONS).optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  // Per-card toggles for what shows on the card face, independent of
  // whether it has a card look at all.
  showBalance: z.boolean().optional(),
  showCurrency: z.boolean().optional(),
  showCardNumber: z.boolean().optional(),
  showName: z.boolean().optional(),
  showHolderName: z.boolean().optional(),
  showExpiry: z.boolean().optional(),
  namePosition: z.enum(NAME_POSITIONS).optional(),
};

export const walletInputSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.string().trim().min(1).max(30),
  background: cardBackgroundSchema.optional(),
  textColor: cardTextColorSchema.optional(),
  kind: z.enum(WALLET_KINDS).default("cash"),
  currency: walletCurrencySchema.optional(),
  ...walletCardVisualFields,
});

export const walletUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(40).optional(),
    color: z.string().trim().min(1).max(30).optional(),
    background: cardBackgroundSchema.optional(),
    textColor: cardTextColorSchema.optional(),
    kind: z.enum(WALLET_KINDS).optional(),
    currency: walletCurrencySchema.optional(),
    isDefault: z.literal(true).optional(),
    archived: z.boolean().optional(),
    startingBalance: z.number().finite().optional(),
    ...walletCardVisualFields,
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Provide at least one field to update",
  });

// A submitted "premade card" design — just the visual skin (background +
// colors), no balance/network/holder/etc. See card_templates in db.ts.
export const cardTemplateInputSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.string().trim().min(1).max(30),
  background: cardBackgroundSchema.optional(),
  textColor: cardTextColorSchema.optional(),
  // Author-forced toggle overrides — omitted/null means "don't force this
  // one", see the force_* column comments in db.ts.
  forceShowName: z.boolean().nullable().optional(),
  forceShowNetworkBadge: z.boolean().nullable().optional(),
  forceShowChip: z.boolean().nullable().optional(),
  forceShowCardNumber: z.boolean().nullable().optional(),
  forceShowBalance: z.boolean().nullable().optional(),
  forceShowCurrency: z.boolean().nullable().optional(),
  // Which currency code to force the wallet itself onto — distinct from
  // forceShowCurrency above (whether it renders at all, not which one).
  forceCurrency: walletCurrencySchema.optional(),
  // Free-text, nullable — which country this template belongs under in
  // PremadeCardPicker's grouping. Not a real force_* field: it isn't
  // applied to the picking wallet at all, just metadata for the gallery.
  country: z.string().trim().max(60).nullable().optional(),
  // Which corner to force the holder-name text into — null means "don't
  // touch it", same convention as the other force_* fields above.
  forceNamePosition: z.enum(NAME_POSITIONS).nullable().optional(),
  // When true, the picker's text-color control is locked to this
  // template's textColor rather than just starting from it.
  lockTextColor: z.boolean().optional(),
  // What kind of real-world card this is — see card-template-category.ts.
  // Nullable metadata only, like country.
  category: z.enum(CARD_TEMPLATE_CATEGORIES).nullable().optional(),
  // Which network to force the wallet itself onto — distinct from
  // forceShowNetworkBadge above (whether a badge renders at all, not which
  // network it is).
  forceNetwork: z.enum(CARD_NETWORKS).nullable().optional(),
  // When true, forces last4/holderName/expiry off the card face and out
  // of the wallet editor entirely — see the force_hide_card_info comment
  // in db.ts.
  forceHideCardInfo: z.boolean().optional(),
});

// Admin-only edit — every field optional (at least one required), used for
// both the quick approve/reject buttons (just `status`) and the full
// edit form.
export const cardTemplateUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(40).optional(),
    color: z.string().trim().min(1).max(30).optional(),
    background: cardBackgroundSchema.optional(),
    textColor: cardTextColorSchema.optional(),
    forceShowName: z.boolean().nullable().optional(),
    forceShowNetworkBadge: z.boolean().nullable().optional(),
    forceShowChip: z.boolean().nullable().optional(),
    forceShowCardNumber: z.boolean().nullable().optional(),
    forceShowBalance: z.boolean().nullable().optional(),
    forceShowCurrency: z.boolean().nullable().optional(),
    forceCurrency: walletCurrencySchema.optional(),
    country: z.string().trim().max(60).nullable().optional(),
    forceNamePosition: z.enum(NAME_POSITIONS).nullable().optional(),
    lockTextColor: z.boolean().optional(),
    category: z.enum(CARD_TEMPLATE_CATEGORIES).nullable().optional(),
    forceNetwork: z.enum(CARD_NETWORKS).nullable().optional(),
    forceHideCardInfo: z.boolean().optional(),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Provide at least one field to update",
  });

export const walletTransferInputSchema = z
  .object({
    fromWalletId: z.number().int().positive(),
    toWalletId: z.number().int().positive(),
    amount: z.number().positive().finite(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .refine((data) => data.fromWalletId !== data.toWalletId, {
    message: "Choose two different wallets",
    path: ["toWalletId"],
  });

export const dashboardWidgetsInputSchema = z.object({
  widgets: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(60),
        type: z.enum(DASHBOARD_WIDGET_TYPES),
        width: z.enum(WIDGET_WIDTHS),
        cards: z.array(z.enum(SUMMARY_CARDS)).optional(),
        accent: z.enum(WIDGET_ACCENTS).optional(),
        limit: z
          .number()
          .int()
          .refine((n) => (LIMIT_OPTIONS as readonly number[]).includes(n))
          .optional(),
        hideAction: z.boolean().optional(),
        walletId: z.number().int().positive().nullable().optional(),
      }),
    )
    .max(20),
});

export const RECURRING_FREQUENCIES = ["weekly", "monthly", "yearly"] as const;

export const recurringRuleInputSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  direction: z.enum(TRANSFER_DIRECTIONS).optional(),
  amount: z.number().positive().finite(),
  merchant: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(500).nullable().optional(),
  walletId: z.number().int().positive().nullable().optional(),
  frequency: z.enum(RECURRING_FREQUENCIES),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export const recurringRuleUpdateSchema = z
  .object({
    active: z.boolean().optional(),
    amount: z.number().positive().finite().optional(),
    merchant: z.string().trim().min(1).max(200).optional(),
    category: z.string().trim().min(1).max(60).optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    walletId: z.number().int().positive().nullable().optional(),
    frequency: z.enum(RECURRING_FREQUENCIES).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Provide at least one field to update",
  });

export const budgetInputSchema = z.object({
  category: z.string().trim().min(1).max(60),
  monthlyLimit: z.number().positive().finite(),
  rollover: z.boolean().optional().default(false),
});

export const budgetDismissAlertSchema = z.object({
  dismissAlertForMonth: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM"),
});

export const reorderMoveSchema = z.object({
  move: z.enum(["up", "down"]),
});

// Drag-to-reorder on the Wallet page — see reorderWallets in db.ts, which
// itself re-validates this is exactly the caller's full active-wallet id
// set before applying it.
export const walletReorderInputSchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1).max(200),
});

export const skipRecurringSchema = z.object({
  skip: z.literal(true),
});

export const apiTokenInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export const savingsGoalInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().trim().min(1).max(30).default("emerald"),
  targetAmount: z.number().positive().finite(),
});

export const savingsGoalUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    color: z.string().trim().min(1).max(30).optional(),
    targetAmount: z.number().positive().finite().optional(),
    contributeDelta: z.number().finite().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Provide at least one field to update",
  });

export const splitExpenseInputSchema = z.object({
  type: z.enum(["expense", "income"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  merchant: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(500).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  walletId: z.number().int().positive().nullable().optional(),
  lines: z
    .array(
      z.object({
        category: z.string().trim().min(1).max(60),
        amount: z.number().positive().finite(),
      }),
    )
    .min(2)
    .max(10),
});

export const csvImportInputSchema = z.object({
  csv: z.string().min(1).max(2_000_000),
});

const categoryIconSchema = z.enum(CATEGORY_ICON_KEYS).nullable();

export const categoryInputSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  name: z.string().trim().min(1).max(40),
  color: z.string().trim().min(1).max(30),
  icon: categoryIconSchema.optional(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  color: z.string().trim().min(1).max(30).optional(),
  icon: categoryIconSchema.optional(),
});

const passZoneSchema = z.enum(PASS_ZONES as [PassZone, ...PassZone[]]);
const passFieldsSchema = z.record(z.string().max(40), z.string().max(80));
const passLayoutSchema = z.record(passZoneSchema, z.array(z.string().nullable())).nullable();

const membershipCategorySchema = z.enum(["pass", "membership"]);

export const membershipInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  codeValue: z.string().trim().min(1).max(128),
  codeFormat: z.enum(MEMBERSHIP_CODE_FORMATS).default("qr"),
  color: z.string().trim().min(1).max(30),
  icon: categoryIconSchema.optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  template: z.enum(PASS_TEMPLATES).default("generic"),
  fields: passFieldsSchema.default({}),
  layout: passLayoutSchema.optional(),
  background: cardBackgroundSchema.optional(),
  textColor: cardTextColorSchema.optional(),
  category: membershipCategorySchema.default("membership"),
});

export const membershipUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    codeValue: z.string().trim().min(1).max(128).optional(),
    codeFormat: z.enum(MEMBERSHIP_CODE_FORMATS).optional(),
    color: z.string().trim().min(1).max(30).optional(),
    icon: categoryIconSchema.optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    template: z.enum(PASS_TEMPLATES).optional(),
    fields: passFieldsSchema.optional(),
    layout: passLayoutSchema.optional(),
    background: cardBackgroundSchema.optional(),
    textColor: cardTextColorSchema.optional(),
    category: membershipCategorySchema.optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Provide at least one field to update",
  });

export const userSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
});

export const friendRequestInputSchema = z.object({
  targetUserId: z.number().int().positive(),
});

export const familyMemberInputSchema = z.object({
  memberId: z.number().int().positive(),
});

export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const challengeInputSchema = z
  .object({
    title: z.string().trim().min(1).max(60),
    type: z.enum(CHALLENGE_TYPES),
    mode: z.enum(CHALLENGE_MODES),
    targetAmount: z.number().positive().finite(),
    category: z.string().trim().min(1).max(60).nullable().optional(),
    startDate: dateStringSchema,
    endDate: dateStringSchema,
    inviteeIds: z.array(z.number().int().positive()).max(20),
  })
  .refine((data) => data.startDate <= data.endDate, { message: "End date must be on or after the start date.", path: ["endDate"] });

export const challengeRespondSchema = z.object({
  accept: z.boolean(),
});

export const challengeContributionInputSchema = z.object({
  amount: z.number().positive().finite(),
});

export const challengeRevealRequestInputSchema = z.object({
  targetUserId: z.number().int().positive(),
});

const splitAmountEntrySchema = z.object({
  userId: z.number().int().positive(),
  amount: z.number().nonnegative().finite(),
});

export const splitInputSchema = z.object({
  title: z.string().trim().min(1).max(60),
  totalAmount: z.number().positive().finite(),
  splitMethod: z.enum(SPLIT_METHODS),
  paymentMethod: z.enum(SPLIT_PAYMENT_METHODS),
  date: dateStringSchema,
  participantIds: z.array(z.number().int().positive()).min(1).max(20),
  customOwed: z.array(splitAmountEntrySchema).optional(),
  customPaid: z.array(splitAmountEntrySchema).optional(),
});

export const splitRespondSchema = z.object({
  accept: z.boolean(),
});

const loanInstallmentEntrySchema = z.object({
  dueDate: dateStringSchema,
  amount: z.number().positive().finite(),
});

export const loanInputSchema = z
  .object({
    counterpartyFriendId: z.number().int().positive().nullable(),
    counterpartyName: z.string().trim().max(60).nullable(),
    direction: z.enum(LOAN_DIRECTIONS),
    principal: z.number().positive().finite(),
    notes: z.string().trim().max(500).nullable().optional(),
    installments: z.array(loanInstallmentEntrySchema).max(60).optional(),
  })
  .refine((data) => data.counterpartyFriendId !== null || (data.counterpartyName ?? "").length > 0, {
    message: "Pick a friend or enter a name for who this loan is with.",
  });
