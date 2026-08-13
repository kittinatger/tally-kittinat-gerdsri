import WidgetCard, { WIDGET_GRADIENT_TEXT } from "./WidgetCard";

// The wallet counterpart to IncomeStatCard/ExpenseStatCard/BalanceStatCard --
// a sky gradient card, giving "money in a specific wallet" its own visual
// language distinct from income (emerald), expense (rose) and the overall
// balance total (blue).
export default function WalletStatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <WidgetCard color="sky" blob="bottom-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700/80 dark:text-sky-300/80">{label}</p>
      <p className={`mt-2 truncate bg-gradient-to-br bg-clip-text font-display text-2xl text-transparent sm:text-3xl ${WIDGET_GRADIENT_TEXT.sky}`}>
        {value}
      </p>
      {sublabel && <p className="mt-1 truncate text-xs text-sky-700/60 dark:text-sky-400/70">{sublabel}</p>}
    </WidgetCard>
  );
}
