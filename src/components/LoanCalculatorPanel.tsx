"use client";

import { useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import { useT } from "@/lib/language-context";

// A standalone amortization calculator — deliberately not wired to
// LoanManager/the `loans` table. It answers "what would the payment be"
// before a loan exists, not "update my saved loan".
export default function LoanCalculatorPanel() {
  const t = useT();
  const currency = useCurrency();
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [months, setMonths] = useState("");

  const principalNum = Number(principal);
  const rateNum = Number(rate);
  const monthsNum = Number(months);
  const valid =
    principal !== "" &&
    rate !== "" &&
    months !== "" &&
    Number.isFinite(principalNum) &&
    Number.isFinite(rateNum) &&
    Number.isFinite(monthsNum) &&
    principalNum > 0 &&
    rateNum >= 0 &&
    monthsNum > 0;

  const monthlyRate = rateNum / 100 / 12;
  const payment = valid
    ? monthlyRate === 0
      ? principalNum / monthsNum
      : (principalNum * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -monthsNum))
    : 0;
  const totalPaid = payment * monthsNum;
  const totalInterest = totalPaid - principalNum;

  return (
    <div className="flex flex-col gap-8">
      <h3 className="font-display text-2xl text-foreground">{t("loanCalculator.title")}</h3>

      <section className="rounded-card border border-line bg-surface p-4">
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("loanCalculator.principalLabel")}</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("loanCalculator.rateLabel")}</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0"
                className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("loanCalculator.monthsLabel")}</label>
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                placeholder="0"
                className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
              />
            </div>
          </div>

          <div className="mt-1 space-y-1.5 rounded-card border border-line bg-background p-3.5">
            {!valid ? (
              <p className="text-center text-sm text-ink-soft">{t("loanCalculator.enterValues")}</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-soft">{t("loanCalculator.monthlyPayment")}</span>
                  <span className="text-xl font-bold text-foreground">{formatCurrency(payment, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{t("loanCalculator.totalPaid")}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(totalPaid, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{t("loanCalculator.totalInterest")}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(totalInterest, currency)}</span>
                </div>
              </>
            )}
          </div>
          <p className="text-[11px] leading-snug text-ink-soft">{t("loanCalculator.disclaimer")}</p>
        </div>
      </section>
    </div>
  );
}
