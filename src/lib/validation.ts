import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";

export const expenseInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  amount: z.number().positive().finite(),
  merchant: z.string().trim().min(1).max(200),
  category: z.enum(CATEGORIES),
  notes: z.string().trim().max(500).nullable().optional(),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
