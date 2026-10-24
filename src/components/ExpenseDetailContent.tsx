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

// The time it was saved, but only when it was saved on the transaction's
// own date — a backdated entry's save time says nothing about when it
// actually happened, so those just show the date.
function savedTimeOnDate(expense: Expense): string | null {
  if (!expense.createdAt) return null;
  const saved = new Date(expense.createdAt);
  if (Number.isNaN(saved.getTime())) return null;
  const localDate = `${saved.getFullYear()}-${String(saved.getMonth() + 1).padStart(2, "0")}-${String(saved.getDate()).padStart(2, "0")}`;
  if (localDate !== expense.date) return null;
  return saved.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
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
 * A transaction's details, laid out for its own page (/transactions/[id]):
 * a hero card with the category, merchant and amount, then the details list
 * beside the map and receipt on wide screens (stacked on phones).
 */
export default function ExpenseDetailContent({
  expense,
  onEdit,
  onMerchantClick,
}: {
  expense: Expense;
  onEdit: () => void;
  /** When provided, the merchant name becomes tappable — jumps to that
   * merchant's other transactions on Activities. */
  onMerchantClick?: (merchant: string) => void;
}) {
  const t = useT();
  const color = useCategoryColor(expense.type, expense.category);
  const icon = useCategoryIcon(expense.type, expense.category);
  const currency = useCurrency();
  const [viewingReceipt, setViewingReceipt] = useState(false);
  const receiptUrl = `/api/expenses/${expense.id}/receipt`;
  const hasLocation = Boolean(expense.locationName) || (expense.latitude != null && expense.longitude != null);
  const hasSide = hasLocation || expense.hasReceipt;
  const savedTime = savedTimeOnDate(expense);
  const dateText = savedTime ? `${formatDateLong(expense.date)} · ${savedTime}` : formatDateLong(expense.date);

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
      className="line-clamp-2 max-w-full break-words font-semibold text-surface-foreground decoration-surface-foreground-soft/40 underline-offset-4 hover:underline"
    >
      {expense.merchant}
    </button>
  ) : (
    <p className="line-clamp-2 break-words font-semibold text-surface-foreground">{expense.merchant}</p>
  );

  const details = (
    <div className="divide-y divide-surface-line self-start overflow-hidden rounded-card border border-surface-line bg-surface">
      <DetailRow icon={<CalendarBlankIcon weight="fill" aria-hidden="true" className="h-[18px] w-[18px]" />} label={t("common.date")}>
        {dateText}
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
      className="group block w-full overflow-hidden rounded-card border border-surface-line bg-surface text-left transition hover:border-surface-accent"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- authenticated API image, not a build-time asset */}
      <img src={receiptUrl} alt="" className="h-44 w-full bg-surface-soft object-cover object-top" />
      <span className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-surface-foreground">
        <ReceiptIcon weight="fill" aria-hidden="true" className="h-4 w-4 text-surface-foreground-soft" />
        {t("activities.viewReceipt")}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Hero: who, how much, when — centred, with the primary actions. */}
      <section className="flex flex-col items-center rounded-card border border-surface-line bg-surface px-5 pb-5 pt-7 text-center sm:px-8 sm:pt-9">
        <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${badgeClasses(color)}`}>
          {icon && isCategoryIconKey(icon) ? (
            <CategoryIcon iconKey={icon} className="h-8 w-8" />
          ) : (
            <span className="text-2xl font-semibold">{expense.category.charAt(0).toUpperCase()}</span>
          )}
        </span>
        <div className="mt-3 max-w-full text-lg sm:text-xl">{merchant}</div>
        <p className="mt-0.5 text-sm text-surface-foreground-soft">
          {expense.category} · {typeLabel}
        </p>
        <p className={`mt-4 text-[44px] font-semibold leading-none tracking-tight tabular-nums sm:text-5xl ${amountColor}`}>
          {signedAmount(expense) >= 0 ? "+" : "−"}
          {formatCurrency(expense.amount, currency)}
        </p>
        <p className="mt-3 rounded-full bg-surface-soft px-3 py-1 text-xs font-medium text-surface-foreground-soft">
          {dateText}
        </p>

        <div className="mt-6 flex w-full max-w-sm gap-2">
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
      </section>

      <div className={`grid gap-4 sm:gap-5 ${hasSide ? "lg:grid-cols-2" : ""}`}>
        {details}
        {hasSide && (
          <div className="flex flex-col gap-4 sm:gap-5">
            {hasLocation && <LocationCard expense={expense} tall />}
            {receipt}
          </div>
        )}
      </div>

      {viewingReceipt && <ReceiptLightbox src={receiptUrl} onClose={() => setViewingReceipt(false)} />}
    </div>
  );
}
