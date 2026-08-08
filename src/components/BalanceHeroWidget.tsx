import { dotClasses } from "@/lib/category-styles";

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
  return (
    <div className="overflow-hidden rounded-card border border-surface-line bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Your balance</p>
      <p className="mt-1.5 truncate font-display text-3xl">{balance}</p>

      {wallets.length > 0 && (
        <div className="mt-3 flex -space-x-2">
          {wallets.slice(0, 6).map((w) => (
            <span
              key={w.id}
              title={w.name}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-emerald-600 ${dotClasses(w.color)}`}
            >
              {w.name.slice(0, 1).toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {lastTransaction && (
        <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-white/10 px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-xs text-white/60">Last transaction</p>
            <p className="truncate text-sm font-semibold">{lastTransaction.label}</p>
          </div>
          <p className="shrink-0 text-sm font-bold">{lastTransaction.value}</p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onAddIncome}
          className="flex-1 rounded-full bg-white/15 py-2.5 text-sm font-semibold transition hover:bg-white/25"
        >
          + Income
        </button>
        <button
          onClick={onAddExpense}
          className="flex-1 rounded-full bg-white py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-white/90"
        >
          + Expense
        </button>
      </div>
    </div>
  );
}
