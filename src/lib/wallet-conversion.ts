import { convertAmount } from "@/lib/exchange-rate";
import type { WalletRow } from "@/lib/db";

// Runs every wallet's conversion in parallel rather than one at a time —
// with a few differing-currency wallets, sequential awaits meant this
// scaled linearly with wallet count; each is now independently bounded by
// convertAmount's own timeout instead of compounding.
//
// Returns null (rather than silently mixing currencies) if any wallet's
// conversion fails — a failed-open fallback here would have summed that
// wallet's *raw, unconverted* balance straight into an appCurrency total,
// producing a number that's numerically wrong, not just stale. Callers
// should fall back to the uncoverted total (e.g. `remaining`) on null.
export async function computeConvertedTotal(wallets: WalletRow[], appCurrency: string): Promise<number | null> {
  const amounts = await Promise.all(
    wallets.map(async (w) => {
      const balance = Number(w.balance);
      if (!w.currency || w.currency === appCurrency) return balance;
      return convertAmount(balance, w.currency, appCurrency);
    }),
  );
  if (amounts.some((a) => a === null)) return null;
  return (amounts as number[]).reduce((sum, v) => sum + v, 0);
}
