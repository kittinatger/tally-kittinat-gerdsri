import { redirect } from "next/navigation";

// Categories has been split into Analytics (category breakdown + trend
// chart) and Settings (category management) pages — redirect old links.
export default function CategoriesPage() {
  redirect("/analytics");
}
