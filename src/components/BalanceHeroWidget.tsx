import { dotClasses } from "@/lib/category-styles";
import { useT } from "@/lib/language-context";

// The large "hero" balance card — its own blue accent, matching
// BalanceStatCard's total-balance color language (distinct from income/
// emerald, expense/rose, and the sky used for individual wallets).
export default function BalanceHeroWidget({
  balance,
  wallets,
  lastTransaction,
  onAddIncome,
  onAddExpense,
}: {
  balance: string;
  wallets: { id: number; name: string; color: string }[];
  lastTransaction: { label: string; date: string; value: string } | null;
  onAddIncome: () => void;
  onAddExpense: () => void;
}) {
  const t = useT();
  return (
    <div className="relative overflow-hidden rounded-card border border-surface-line bg-gradient-to-br from-blue-500 to-blue-700 p-5 text-white shadow-sm">
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <p className="relative text-xs font-semibold uppercase tracking-wide text-white/70">{t("activities.yourBalance")}</p>
      <p className="relative mt-1.5 truncate font-display text-3xl">{balance}</p>

      {wallets.length > 0 && (
        <div className="relative mt-3 flex -space-x-2">
          {wallets.slice(0, 6).map((w) => (
            <span
              key={w.id}
              title={w.name}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-blue-600 ${dotClasses(w.color)}`}
            >
              {w.name.slice(0, 1).toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {lastTransaction && (
        <div className="relative mt-4 flex items-center justify-between gap-2 rounded-2xl bg-white/10 px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-xs text-white/60">{t("activities.lastTransaction")}</p>
            <p className="truncate text-sm font-semibold">{lastTransaction.label}</p>
          </div>
          <p className="shrink-0 text-sm font-bold">{lastTransaction.value}</p>
        </div>
      )}

      <div className="relative mt-4 flex items-center gap-2">
        <button
          onClick={onAddIncome}
          className="flex-1 rounded-full bg-white/15 py-2.5 text-sm font-semibold transition hover:bg-white/25"
        >
          + {t("common.income")}
        </button>
        <button
          onClick={onAddExpense}
          className="flex-1 rounded-full bg-white py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-white/90"
        >
          + {t("common.expense")}
        </button>
      </div>
    </div>
  );
}
