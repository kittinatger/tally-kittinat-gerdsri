import { dotClasses } from "@/lib/category-styles";

function DepositIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect x="2.5" y="6" width="15" height="10.5" rx="2.5" />
      <path d="M10 8v5m0 0 2-2m-2 2-2-2" />
    </svg>
  );
}

function WithdrawIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect x="2.5" y="6" width="15" height="10.5" rx="2.5" />
      <path d="M10 13V8m0 0-2 2m2-2 2 2" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect x="2.5" y="6" width="15" height="10.5" rx="2.5" />
      <path d="M7 11.5h6m0 0-2.2-2.2M13 11.5l-2.2 2.2" />
    </svg>
  );
}

export default function BalanceHeroWidget({
  balance,
  wallets,
  lastTransaction,
  onAddIncome,
  onAddExpense,
  onAddTransfer,
}: {
  balance: string;
  wallets: { id: number; name: string; color: string }[];
  lastTransaction: { label: string; date: string; value: string } | null;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddTransfer?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-card border border-neutral-800 bg-neutral-900 p-5 text-white">
      <div className="pointer-events-none absolute -right-10 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-2 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border border-white/10" />

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Your balance</p>
        <p className="mt-1.5 truncate font-display text-3xl">{balance}</p>

        {wallets.length > 0 && (
          <div className="mt-3 flex -space-x-2">
            {wallets.slice(0, 6).map((w) => (
              <span
                key={w.id}
                title={w.name}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-neutral-900 ${dotClasses(w.color)}`}
              >
                {w.name.slice(0, 1).toUpperCase()}
              </span>
            ))}
          </div>
        )}

        {lastTransaction && (
          <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-white/10 px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-xs text-white/50">Last transaction</p>
              <p className="truncate text-sm font-semibold">{lastTransaction.label}</p>
            </div>
            <p className="shrink-0 text-sm font-bold">{lastTransaction.value}</p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-white/5 p-2.5">
          <button onClick={onAddIncome} className="group flex flex-1 flex-col items-center gap-1.5 py-1">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition group-hover:bg-white/15">
              <DepositIcon />
            </span>
            <span className="text-xs font-semibold text-white/80">Deposit</span>
          </button>
          <button onClick={onAddExpense} className="group flex flex-1 flex-col items-center gap-1.5 py-1">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition group-hover:bg-white/15">
              <WithdrawIcon />
            </span>
            <span className="text-xs font-semibold text-white/80">Withdraw</span>
          </button>
          <button onClick={onAddTransfer ?? onAddExpense} className="group flex flex-1 flex-col items-center gap-1.5 py-1">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400 text-neutral-900">
              <TransferIcon />
            </span>
            <span className="text-xs font-semibold text-white">Transfer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
