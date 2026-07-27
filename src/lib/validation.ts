import { z } from "zod";
import { TRANSACTION_TYPES } from "@/lib/categories";

const sharedFields = {
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  amount: z.number().positive().finite(),
  merchant: z.string().trim().min(1).max(200),
  // Categories are now user-editable (see the categories table), so this is
  // validated as free text here; API routes trust the value against
  // whatever categories currently exist rather than a fixed enum.
  category: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(500).nullable().optional(),
};

export const expenseInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("expense"), ...sharedFields }),
  z.object({ type: z.literal("income"), ...sharedFields }),
]);

export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export const settingsInputSchema = z.object({
  remaining: z.number().finite(),
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
