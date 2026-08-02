import { z } from "zod";
import { TRANSACTION_TYPES, TRANSFER_DIRECTIONS } from "@/lib/categories";
import { WALLET_KINDS } from "@/lib/wallets";
import { DASHBOARD_WIDGET_TYPES, WIDGET_WIDTHS, SUMMARY_CARDS } from "@/lib/dashboard-widgets";

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
  })
  .refine(
    (data) => data.remaining !== undefined || data.currency !== undefined || data.autoConvertCurrency !== undefined,
    { message: "Provide remaining, currency, and/or autoConvertCurrency" },
  );

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

export const walletInputSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.string().trim().min(1).max(30),
  kind: z.enum(WALLET_KINDS).default("cash"),
});

export const walletUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(40).optional(),
    color: z.string().trim().min(1).max(30).optional(),
    kind: z.enum(WALLET_KINDS).optional(),
    startingBalance: z.number().finite().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined || data.color !== undefined || data.kind !== undefined || data.startingBalance !== undefined,
    { message: "Provide name, color, kind, and/or startingBalance" },
  );

export const dashboardWidgetsInputSchema = z.object({
  widgets: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(60),
        type: z.enum(DASHBOARD_WIDGET_TYPES),
        width: z.enum(WIDGET_WIDTHS),
        cards: z.array(z.enum(SUMMARY_CARDS)).optional(),
      }),
    )
    .max(20),
});

export const categoryInputSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  name: z.string().trim().min(1).max(40),
  color: z.string().trim().min(1).max(30),
});

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  color: z.string().trim().min(1).max(30).optional(),
});
