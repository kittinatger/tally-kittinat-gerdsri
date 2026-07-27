"use client";

import { createContext, useContext } from "react";
import type { TransactionType } from "@/lib/categories";
import type { CategoryOption } from "@/types/category";

const CategoriesContext = createContext<CategoryOption[]>([]);

export function CategoriesProvider({
  categories,
  children,
}: {
  categories: CategoryOption[];
  children: React.ReactNode;
}) {
  return <CategoriesContext.Provider value={categories}>{children}</CategoriesContext.Provider>;
}

export function useAllCategories(): CategoryOption[] {
  return useContext(CategoriesContext);
}

export function useCategories(type: TransactionType): CategoryOption[] {
  const all = useContext(CategoriesContext);
  return all.filter((c) => c.type === type);
}

export function useCategoryColor(type: TransactionType, name: string): string | undefined {
  const all = useContext(CategoriesContext);
  return all.find((c) => c.type === type && c.name === name)?.color;
}
