"use client";

import Link from "next/link";
import { dotClasses } from "@/lib/category-styles";
import { useCurrency } from "@/lib/currency-context";
import { useWallets } from "@/lib/wallets-context";
import { formatCurrency } from "@/lib/format";

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
      <div className="space-y-2.5">
        {wallets.map((w) => (
          <div key={w.id} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClasses(w.color)}`} />
              <span className="truncate text-sm font-medium text-surface-foreground">{w.name}</span>
            </div>
            <span
              className={`shrink-0 text-sm font-semibold ${
                w.balance < 0 ? "text-red-600 dark:text-red-400" : "text-surface-foreground"
              }`}
            >
              {formatCurrency(w.balance, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
