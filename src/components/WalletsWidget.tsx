"use client";

import Link from "next/link";
import { dotClasses } from "@/lib/category-styles";
import { useCurrency } from "@/lib/currency-context";
import { useWallets } from "@/lib/wallets-context";
import { formatCurrency } from "@/lib/format";

function WalletKindIcon({ kind }: { kind: string }) {
  if (kind === "digital") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <rect x="2" y="5" width="20" height="14" rx="2.5" />
        <path d="M2 10h20" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="2" y="6" width="20" height="12" rx="2.5" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export default function WalletsWidget() {
  const wallets = useWallets();
  const currency = useCurrency();

  if (wallets.length === 0) return null;

  return (
    <div className="rounded-card border border-surface-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">Wallets</p>
        <Link href="/settings" className="text-xs font-semibold text-surface-accent hover:underline">
          Manage
        </Link>
      </div>
      <div className="-mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1">
        {wallets.map((w) => (
          <div
            key={w.id}
            className="w-32 shrink-0 snap-start rounded-2xl border border-surface-line bg-surface-soft p-3"
          >
            <div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-white ${dotClasses(w.color)}`}>
              <WalletKindIcon kind={w.kind} />
            </div>
            <p className="truncate text-xs font-semibold text-surface-foreground">{w.name}</p>
            <p
              className={`mt-0.5 truncate text-sm font-bold ${
                w.balance < 0 ? "text-red-600 dark:text-red-400" : "text-surface-foreground"
              }`}
            >
              {formatCurrency(w.balance, w.currency ?? currency)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
