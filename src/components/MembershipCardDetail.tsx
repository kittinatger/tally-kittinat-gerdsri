"use client";

import { useState } from "react";
import { EditIcon, TrashIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import PassShape from "./PassShape";
import { membershipImageUrl } from "@/lib/membership-card-mapper";
import type { MembershipCard } from "@/types/membership";

// Rendered with key={card.id} by the caller (WalletPageView) so switching
// which card is selected remounts this component and resets confirming —
// otherwise a second-click "confirm delete" armed for one card could stay
// armed after the user switches to a different card.
export default function MembershipCardDetail({
  card,
  onEdit,
  onDelete,
}: {
  card: MembershipCard;
  onEdit: () => void;
  /** Called only after the user has confirmed (second click) — perform the
   * actual deletion here. */
  onDelete: () => void;
}) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);

  function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onDelete();
  }
  return (
    <div>
      <PassShape
        name={card.name}
        color={card.color}
        background={card.background}
        textColor={card.textColor}
        icon={card.icon}
        kind={card.kind}
        fields={card.fields}
        layout={card.layout}
        codeValue={card.codeValue}
        codeFormat={card.codeFormat}
        codeSize="large"
        logoUrl={card.hasLogo ? membershipImageUrl(card.id, "logo", card.logoUpdatedAt) : null}
        bannerUrl={card.hasBanner ? membershipImageUrl(card.id, "banner", card.bannerUpdatedAt) : null}
        notes={card.notes}
        customFieldLabels={card.customFieldLabels}
        showLogo={card.showLogo}
        showName={card.showName}
        hiddenFieldLabels={card.hiddenFieldLabels}
        showCodeText={card.showCodeText}
      />

      {card.notes && (
        <p className="mt-4 whitespace-pre-wrap rounded-card border border-line bg-surface p-3.5 text-sm text-ink-soft">
          {card.notes}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-navy"
        >
          <EditIcon className="h-4 w-4" />
          {t("common.edit")}
        </button>
        <button
          type="button"
          onClick={handleDeleteClick}
          aria-label={confirming ? t("common.confirmDelete") : t("common.delete")}
          className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition ${
            confirming
              ? "border-red-300 bg-red-600 text-white hover:bg-red-700"
              : "border-line text-ink-soft hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          }`}
        >
          <TrashIcon />
          {confirming && <span>{t("common.confirmDelete")}</span>}
        </button>
      </div>
    </div>
  );
}
