import { convertAmount } from "@/lib/exchange-rate";
import type { WalletRow } from "@/lib/db";

// Runs every wallet's conversion in parallel rather than one at a time —
// with a few differing-currency wallets, sequential awaits meant this
// scaled linearly with wallet count; each is now independently bounded by
// convertAmount's own timeout instead of compounding.
export async function computeConvertedTotal(wallets: WalletRow[], appCurrency: string): Promise<number> {
  const amounts = await Promise.all(
    wallets.map(async (w) => {
      const balance = Number(w.balance);
      if (!w.currency || w.currency === appCurrency) return balance;
      const converted = await convertAmount(balance, w.currency, appCurrency);
      return converted ?? balance;
    }),
  );
  return amounts.reduce((sum, v) => sum + v, 0);
}
