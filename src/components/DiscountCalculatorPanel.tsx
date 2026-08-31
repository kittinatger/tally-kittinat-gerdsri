"use client";

import { useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import { useT } from "@/lib/language-context";

type Mode = "discount" | "tip";

// Pure client-side arithmetic — recomputed inline from state on every
// keystroke, no debounce/fetch needed the way the currency converter has.
export default function DiscountCalculatorPanel() {
  const t = useT();
  const currency = useCurrency();
  const [mode, setMode] = useState<Mode>("discount");
  const [amount, setAmount] = useState("");
  const [percent, setPercent] = useState("");
  const [people, setPeople] = useState("1");

  const amountNum = Number(amount);
  const percentNum = Number(percent);
  const peopleNum = Math.max(1, Math.floor(Number(people)) || 1);
  const valid = amount !== "" && percent !== "" && Number.isFinite(amountNum) && Number.isFinite(percentNum) && amountNum >= 0 && percentNum >= 0;

  const portion = valid ? amountNum * (percentNum / 100) : 0;
  const discountFinal = amountNum - portion;
  const tipTotal = amountNum + portion;

  return (
    <div className="flex flex-col gap-8">
      <h3 className="font-display text-2xl text-foreground">{t("discountCalculator.title")}</h3>

      <section className="rounded-card border border-line bg-surface p-4">
        <div className="flex gap-1 rounded-full bg-bg-soft p-1">
          <button
            type="button"
            onClick={() => setMode("discount")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              mode === "discount" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
            }`}
          >
            {t("discountCalculator.modeDiscount")}
          </button>
          <button
            type="button"
            onClick={() => setMode("tip")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              mode === "tip" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
            }`}
          >
            {t("discountCalculator.modeTip")}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
              {mode === "discount" ? t("discountCalculator.priceLabel") : t("discountCalculator.billLabel")}
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
              {mode === "discount" ? t("discountCalculator.discountPercentLabel") : t("discountCalculator.tipPercentLabel")}
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="1"
              min="0"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="0"
              className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
            />
          </div>

          {mode === "tip" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("discountCalculator.splitLabel")}</label>
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
              />
            </div>
          )}

          <div className="mt-1 space-y-1.5 rounded-card border border-line bg-background p-3.5">
            {!valid ? (
              <p className="text-center text-sm text-ink-soft">{t("discountCalculator.enterValues")}</p>
            ) : mode === "discount" ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{t("discountCalculator.youSave")}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(portion, currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-soft">{t("discountCalculator.finalPrice")}</span>
                  <span className="text-xl font-bold text-foreground">{formatCurrency(discountFinal, currency)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{t("discountCalculator.tipAmount")}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(portion, currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-soft">{t("discountCalculator.total")}</span>
                  <span className="text-xl font-bold text-foreground">{formatCurrency(tipTotal, currency)}</span>
                </div>
                {peopleNum > 1 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-soft">{t("discountCalculator.perPerson")}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(tipTotal / peopleNum, currency)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
