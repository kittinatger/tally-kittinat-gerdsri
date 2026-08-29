import type { CardBackground } from "@/lib/card-backgrounds";

// A user-submitted "premade card" design — see card_templates in db.ts.
// Purely the visual skin (background + colors); a picker applies these
// three fields onto whatever wallet is currently being edited.
export type CardTemplateOption = {
  id: number;
  name: string;
  color: string;
  background: CardBackground | null;
  textColor: string | null;
  status: "pending" | "approved" | "rejected";
  submittedByUsername: string | null;
  createdAt: string;
};
