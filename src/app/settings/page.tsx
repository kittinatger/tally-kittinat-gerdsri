import { listCategories, getCurrency, getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsView from "@/components/SettingsView";
import type { CategoryOption } from "@/types/category";

// Always render fresh, same reasoning as the dashboard page.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await getUserId();
  const [categoryRows, currency, user] = await Promise.all([
    listCategories(userId),
    getCurrency(userId),
    getUserById(userId),
  ]);
  const categories: CategoryOption[] = categoryRows.map((c) => ({
    id: c.id,
    type: c.type === "income" ? "income" : "expense",
    name: c.name,
    color: c.color,
  }));

  return <SettingsView categories={categories} currency={currency} username={user?.username ?? ""} />;
}
