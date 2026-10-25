"use client";

import { CheckIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { signedAmount, type Expense } from "@/types/expense";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { badgeClasses, dotClasses } from "@/lib/category-styles";
import { useCategoryColor, useCategoryIcon } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import { isCategoryIconKey } from "@/lib/category-icons";
import { CategoryIcon } from "@/lib/icons";
import { RowBadges } from "./ExpenseRow";

const COLS: Record<string, string> = {
  "": "grid-cols-[minmax(0,1fr)_8rem_7rem] lg:grid-cols-[minmax(0,1fr)_9rem_8rem_8rem]",
  d: "grid-cols-[6.5rem_minmax(0,1fr)_8rem_7rem] lg:grid-cols-[6.5rem_minmax(0,1fr)_9rem_8rem_8rem]",
  s: "grid-cols-[1.25rem_minmax(0,1fr)_8rem_7rem] lg:grid-cols-[1.25rem_minmax(0,1fr)_9rem_8rem_8rem]",
  sd: "grid-cols-[1.25rem_6.5rem_minmax(0,1fr)_8rem_7rem] lg:grid-cols-[1.25rem_6.5rem_minmax(0,1fr)_9rem_8rem_8rem]",
};

export type TableGroup = { key: string; label: string | null; net: number; items: Expense[] };

// The iPad/desktop rendering of Activities' list (ExpenseList with
// layout="table"): one card of rows with columns — date, merchant, category,
// wallet, amount — under a header per group, instead of the phone's stacked
// rows. Same data, filtering and selection as the phone list.
export default function ExpenseTable({
  groups,
  showDate,
  selectMode,
  selectedIds,
  onToggleSelect,
  onSelect,
  onEdit,
  onDelete,
}: {
  groups: TableGroup[];
  /** The date column is dropped when every group is already a single day. */
  showDate: boolean;
  selectMode: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onSelect: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete: (id: number) => void;
}) {
  const currency = useCurrency();
  // Wallet only gets its own column on desktop widths; on iPad it would squeeze
  // the merchant name. (Static class names so Tailwind generates them.)
  const cols = COLS[`${selectMode ? "s" : ""}${showDate ? "d" : ""}`];

  return (
    <div className="overflow-clip rounded-card border border-surface-line bg-surface">
      {/* Column headings */}
      <div
        className={`grid items-center gap-4 border-b border-surface-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-surface-foreground-soft ${cols}`}
      >
        {selectMode && <span />}
        {showDate && <span>Date</span>}
        <span>Merchant</span>
        <span>Category</span>
        <span className="hidden truncate lg:block">Wallet</span>
        <span className="text-right">Amount</span>
      </div>

      {groups.map((g) => (
        <section key={g.key}>
          {g.label && (
            <div className="sticky top-[72px] z-[1] lg:top-0 flex items-center justify-between border-b border-surface-line bg-surface-soft/95 px-5 py-2 backdrop-blur">
              <h3 data-date-heading className="text-xs font-semibold text-surface-foreground">
                {g.label}
              </h3>
              <span className={`text-xs font-semibold tabular-nums ${g.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {g.net >= 0 ? "+" : "−"}
                {formatCurrency(Math.abs(g.net), currency)}
              </span>
            </div>
          )}
          <ul className="divide-y divide-surface-line">
            {g.items.map((e) => (
              <TableRow
                key={e.id}
                expense={e}
                cols={cols}
                showDate={showDate}
                selectMode={selectMode}
                selected={selectedIds.has(e.id)}
                onClick={() => (selectMode ? onToggleSelect(e.id) : onSelect(e))}
                onEdit={onEdit ? () => onEdit(e) : undefined}
                onDelete={() => onDelete(e.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TableRow({
  expense: e,
  cols,
  showDate,
  selectMode,
  selected,
  onClick,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  cols: string;
  showDate: boolean;
  selectMode: boolean;
  selected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  const currency = useCurrency();
  const color = useCategoryColor(e.type, e.category);
  const icon = useCategoryIcon(e.type, e.category);
  const amountClass =
    e.type === "income" ? "text-emerald-600 dark:text-emerald-400" : e.type === "transfer" ? "text-surface-foreground-soft" : "text-red-600 dark:text-red-400";

  return (
    <li className={`group relative ${selected ? "bg-surface-accent/[0.06]" : ""}`}>
      <button
        type="button"
        onClick={onClick}
        className={`grid w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-[var(--surface-nav-hover)] ${cols}`}
      >
        {selectMode && (
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
              selected ? "border-surface-accent bg-surface-accent text-white" : "border-surface-line"
            }`}
          >
            {selected && <CheckIcon weight="fill" aria-hidden="true" className="h-3 w-3" />}
          </span>
        )}
        {showDate && <span className="whitespace-nowrap text-sm tabular-nums text-surface-foreground-soft">{formatDateShort(e.date)}</span>}
        <span className="flex min-w-0 items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${badgeClasses(color)}`}>
            {icon && isCategoryIconKey(icon) ? (
              <CategoryIcon iconKey={icon} className="h-[18px] w-[18px]" />
            ) : (
              <span className="text-sm font-semibold">{e.category.charAt(0).toUpperCase()}</span>
            )}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-surface-foreground">{e.merchant}</span>
              <RowBadges expense={e} />
            </span>
            {(e.notes || e.tags.length > 0) && (
              <span className="block truncate text-xs text-surface-foreground-soft">
                {[e.notes, ...e.tags.map((tag) => `#${tag}`)].filter(Boolean).join(" · ")}
              </span>
            )}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-surface-foreground">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses(color)}`} />
          <span className="truncate">{e.category}</span>
        </span>
        <span className="hidden truncate text-sm text-surface-foreground-soft lg:block">{e.walletName ?? "—"}</span>
        <span className={`text-right text-sm font-semibold tabular-nums ${amountClass}`}>
          {signedAmount(e) >= 0 ? "+" : "−"}
          {formatCurrency(e.amount, currency)}
        </span>
      </button>

      {/* Quick actions over the amount on hover (mouse/trackpad). */}
      {!selectMode && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1 pl-16 pr-4 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
          style={{ background: "linear-gradient(to left, var(--surface) 65%, transparent)" }}
        >
          {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${e.merchant}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
          >
            <PencilSimpleIcon weight="fill" aria-hidden="true" className="h-4 w-4" />
          </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${e.merchant}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <TrashIcon weight="fill" aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}
    </li>
  );
}
