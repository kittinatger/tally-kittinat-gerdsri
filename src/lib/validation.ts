import { z } from "zod";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";

const sharedFields = {
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  amount: z.number().positive().finite(),
  merchant: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(500).nullable().optional(),
};

export const expenseInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("expense"), category: z.enum(EXPENSE_CATEGORIES), ...sharedFields }),
  z.object({ type: z.literal("income"), category: z.enum(INCOME_CATEGORIES), ...sharedFields }),
]);

export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export const settingsInputSchema = z.object({
  startingBalance: z.number().finite(),
});
