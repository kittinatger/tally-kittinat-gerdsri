import type { TransactionType } from "@/lib/categories";

export type CategoryOption = {
  id: number;
  type: TransactionType;
  name: string;
  color: string;
  icon: string | null;
};
