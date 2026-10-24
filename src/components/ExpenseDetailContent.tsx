"use client";

import { useState } from "react";
import {
  ArrowSquareOutIcon,
  CalendarBlankIcon,
  ExportIcon,
  MapPinIcon,
  NoteIcon,
  ReceiptIcon,
  SwapIcon,
  TagIcon,
  WalletIcon,
} from "@phosphor-icons/react/dist/ssr";
import { signedAmount, type Expense } from "@/types/expense";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { badgeClasses, dotClasses } from "@/lib/category-styles";
import { useCategoryColor, useCategoryIcon } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import { isCategoryIconKey } from "@/lib/category-icons";
import { CategoryIcon, EditIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import { mapsUrl, openInMapsApp, resolveMapsApp, useMapsAppPreference } from "@/lib/maps-app";
import { shareExpense } from "./ExpenseRow";
import ReceiptLightbox from "./ReceiptLightbox";

// OpenStreetMap's embeddable map, framed tightly around the pin. Loaded
// lazily and only when the transaction actually has coordinates.
function osmEmbedUrl(lat: number, lng: number): string {
  const d = 0.004;
  const bbox = [lng - d, lat - d * 0.6, lng + d, lat + d * 0.6].map((n) => n.toFixed(6)).join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 flex w-[18px] shrink-0 justify-center text-surface-foreground-soft">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-surface-foreground-soft">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-surface-foreground">{children}</div>
      </div>
    </div>
  );
}

function LocationCard({ expense, tall }: { expense: Expense; tall: boolean }) {
  const t = useT();
  const hasCoords = expense.latitude != null && expense.longitude != null;
  const mapsPref = useMapsAppPreference();
  const mapsApp = resolveMapsApp(mapsPref);
  const place = { name: expense.locationName, latitude: expense.latitude, longitude: expense.longitude };
  const url = mapsUrl(mapsApp, place);
  return (
    <div className="overflow-hidden rounded-card border border-surface-line bg-surface">
      {hasCoords && (
        <div className={`relative ${tall ? "h-56" : "h-40"} bg-surface-soft`}>
          <iframe
            title={t("detail.location")}
            src={osmEmbedUrl(expense.latitude!, expense.longitude!)}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="pointer-events-none h-full w-full border-0 dark:[filter:invert(0.9)_hue-rotate(180deg)_saturate(0.8)]"
          />
        </div>
      )}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-accent/10 text-surface-accent">
          <MapPinIcon weight="fill" aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-surface-foreground-soft">{t("detail.location")}</p>
          <p className="line-clamp-2 text-sm font-medium text-surface-foreground">
            {expense.locationName || t("detail.pinnedLocation")}
          </p>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (openInMapsApp(mapsPref, place)) e.preventDefault();
            }}
            aria-label={t("detail.openInMaps")}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-surface-line px-2.5 py-1.5 text-xs font-semibold text-surface-foreground transition hover:border-surface-accent hover:text-surface-accent"
          >
            <span className="hidden sm:inline">{t("detail.openInMaps")}</span>
            <ArrowSquareOutIcon weight="fill" aria-hidden="true" className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Transaction details, in two shapes:
 * - "sheet" (mobile/tablet, inside ExpenseDetailModal's bottom sheet): one
 *   stacked column, read top to bottom.
 * - "pane" (desktop, Activities' right-hand pane): a wide header with the
 *   amount alongside the merchant, then details beside the map/receipt.
 * Both render the same data from this one component.
 */
export default function ExpenseDetailContent({
  expense,
  onEdit,
  onMerchantClick,
  variant = "sheet",
}: {
  expense: Expense;
  onEdit: () => void;
  /** When provided, the merchant name becomes tappable — jumps to that
   * merchant's other transactions (see ActivitiesView.handleMerchantClick). */
  onMerchantClick?: (merchant: string) => void;
  variant?: "sheet" | "pane";
}) {
  const t = useT();
  const color = useCategoryColor(expense.type, expense.category);
  const icon = useCategoryIcon(expense.type, expense.category);
  const currency = useCurrency();
  const [viewingReceipt, setViewingReceipt] = useState(false);
  const receiptUrl = `/api/expenses/${expense.id}/receipt`;
  const pane = variant === "pane";
  const hasLocation = Boolean(expense.locationName) || (expense.latitude != null && expense.longitude != null);

  const amountColor =
    expense.type === "income"
      ? "text-emerald-600 dark:text-emerald-400"
      : expense.type === "expense"
        ? "text-red-600 dark:text-red-400"
        : "text-surface-foreground";
  const typeLabel =
    expense.type === "income"
      ? t("common.income")
      : expense.type === "expense"
        ? t("common.expense")
        : `${t("common.transfer")} · ${expense.direction === "in" ? t("form.moneyIn") : t("form.moneyOut")}`;

  const merchant = onMerchantClick ? (
    <button
      type="button"
      onClick={() => onMerchantClick(expense.merchant)}
      className="line-clamp-2 max-w-full break-words text-left font-semibold text-surface-foreground decoration-surface-foreground-soft/40 underline-offset-4 hover:underline"
    >
      {expense.merchant}
    </button>
  ) : (
    <p className="line-clamp-2 break-words font-semibold text-surface-foreground">{expense.merchant}</p>
  );

  const categoryTile = (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl ${pane ? "h-14 w-14" : "h-12 w-12"} ${badgeClasses(color)}`}
    >
      {icon && isCategoryIconKey(icon) ? (
        <CategoryIcon iconKey={icon} className={pane ? "h-7 w-7" : "h-6 w-6"} />
      ) : (
        <span className="text-lg font-semibold">{expense.category.charAt(0).toUpperCase()}</span>
      )}
    </span>
  );

  const amount = (
    <p className={`font-semibold tabular-nums tracking-tight ${pane ? "text-4xl" : "text-[40px] leading-none"} ${amountColor}`}>
      {signedAmount(expense) >= 0 ? "+" : "−"}
      {formatCurrency(expense.amount, currency)}
    </p>
  );

  const details = (
    <div className="divide-y divide-surface-line overflow-hidden rounded-card border border-surface-line bg-surface">
      <DetailRow icon={<CalendarBlankIcon weight="fill" aria-hidden="true" className="h-[18px] w-[18px]" />} label={t("common.date")}>
        {formatDateLong(expense.date)}
      </DetailRow>
      <DetailRow
        icon={<span className={`mt-1 block h-2.5 w-2.5 rounded-full ${dotClasses(color)}`} />}
        label={t("common.category")}
      >
        {expense.category}
      </DetailRow>
      <DetailRow icon={<SwapIcon weight="fill" aria-hidden="true" className="h-[18px] w-[18px]" />} label={t("detail.type")}>
        {typeLabel}
      </DetailRow>
      {expense.walletName && (
        <DetailRow icon={<WalletIcon weight="fill" aria-hidden="true" className="h-[18px] w-[18px]" />} label={t("common.wallet")}>
          {expense.walletName}
        </DetailRow>
      )}
      {expense.tags.length > 0 && (
        <DetailRow icon={<TagIcon weight="fill" aria-hidden="true" className="h-[18px] w-[18px]" />} label={t("common.tags")}>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {expense.tags.map((tag) => (
              <span key={tag} className={`rounded-md px-2 py-0.5 text-xs font-semibold ${badgeClasses(color)}`}>
                #{tag}
              </span>
            ))}
          </div>
        </DetailRow>
      )}
      {expense.notes && (
        <DetailRow icon={<NoteIcon weight="fill" aria-hidden="true" className="h-[18px] w-[18px]" />} label={t("common.notes")}>
          <p className="whitespace-pre-wrap font-normal">{expense.notes}</p>
        </DetailRow>
      )}
    </div>
  );

  const receipt = expense.hasReceipt && (
    <button
      type="button"
      onClick={() => setViewingReceipt(true)}
      className="group flex w-full items-center gap-3 overflow-hidden rounded-card border border-surface-line bg-surface p-2.5 pr-4 text-left transition hover:border-surface-accent"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- authenticated API image, not a build-time asset */}
      <img src={receiptUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      <span className="flex flex-1 items-center gap-1.5 text-sm font-semibold text-surface-foreground">
        <ReceiptIcon weight="fill" aria-hidden="true" className="h-4 w-4 text-surface-foreground-soft" />
        {t("activities.viewReceipt")}
      </span>
    </button>
  );

  const actions = (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-dark"
      >
        <EditIcon />
        {t("modal.editTransaction")}
      </button>
      <button
        type="button"
        onClick={() => shareExpense(expense, currency)}
        aria-label={t("detail.share")}
        title={t("detail.share")}
        className="flex w-11 shrink-0 items-center justify-center rounded-lg border border-surface-line text-surface-foreground-soft transition hover:border-surface-accent hover:text-surface-accent"
      >
        <ExportIcon weight="fill" aria-hidden="true" className="h-[18px] w-[18px]" />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {pane ? (
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            {categoryTile}
            <div className="min-w-0">
              <div className="text-lg">{merchant}</div>
              <p className="mt-0.5 text-sm text-surface-foreground-soft">{typeLabel}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">{amount}</div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            {categoryTile}
            <div className="min-w-0">
              <div className="text-base">{merchant}</div>
              <p className="mt-0.5 text-sm text-surface-foreground-soft">{expense.category}</p>
            </div>
          </div>
          <div>
            {amount}
            <p className="mt-1.5 text-sm text-surface-foreground-soft">{formatDateLong(expense.date)}</p>
          </div>
        </>
      )}

      {pane ? (
        <div className={`grid gap-4 ${hasLocation || expense.hasReceipt ? "xl:grid-cols-2" : ""}`}>
          <div className="flex flex-col gap-4">{details}</div>
          {(hasLocation || expense.hasReceipt) && (
            <div className="flex flex-col gap-4">
              {hasLocation && <LocationCard expense={expense} tall />}
              {receipt}
            </div>
          )}
        </div>
      ) : (
        <>
          {hasLocation && <LocationCard expense={expense} tall={false} />}
          {details}
          {receipt}
        </>
      )}

      {actions}

      {viewingReceipt && <ReceiptLightbox src={receiptUrl} onClose={() => setViewingReceipt(false)} />}
    </div>
  );
}
