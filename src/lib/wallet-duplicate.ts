import type { WalletOption } from "@/types/wallet";
import { DEFAULT_BACK_DESIGN } from "@/lib/card-back";

// Makes a copy of a wallet / card the user owns: the same look (colour,
// background, text colour, network, chip/NFC, what shows on the face), the
// same details (holder, last 4, expiry, notes), signature, back design and
// folder. Not copied: the balance and transactions (the copy starts at
// zero), whether it's the default wallet, and sharing.
const NAME_MAX = 40;
const COPY_SUFFIX = " (copy)";

export function copyName(name: string): string {
  return name.length + COPY_SUFFIX.length <= NAME_MAX ? name + COPY_SUFFIX : name.slice(0, NAME_MAX - COPY_SUFFIX.length).trimEnd() + COPY_SUFFIX;
}

async function send(url: string, method: string, body: object): Promise<Response> {
  return fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

/** Resolves to the new wallet's id; throws with a readable message on failure. */
export async function duplicateWallet(w: WalletOption): Promise<number> {
  const res = await send("/api/wallets", "POST", {
    name: copyName(w.name),
    color: w.color,
    background: w.background,
    textColor: w.textColor,
    kind: w.kind,
    currency: w.currency,
    holderName: w.holderName,
    last4: w.last4,
    expiryMonth: w.expiryMonth,
    expiryYear: w.expiryYear,
    network: w.network,
    showNetworkBadge: w.showNetworkBadge,
    badgePosition: w.badgePosition,
    iconColor: w.iconColor,
    showChip: w.showChip,
    chipColor: w.chipColor,
    chipPosition: w.chipPosition,
    showNfc: w.showNfc,
    nfcPosition: w.nfcPosition,
    nfcSize: w.nfcSize,
    notes: w.notes,
    showBalance: w.showBalance,
    showCurrency: w.showCurrency,
    showCardNumber: w.showCardNumber,
    cardNumberLast4Only: w.cardNumberLast4Only,
    cardNumberPosition: w.cardNumberPosition,
    showName: w.showName,
    showHolderName: w.showHolderName,
    showExpiry: w.showExpiry,
    namePosition: w.namePosition,
    category: w.category,
  });
  const data = await res.json().catch(() => null);
  const id: unknown = data?.wallet?.id;
  if (!res.ok || typeof id !== "number") {
    throw new Error(typeof data?.error === "string" ? data.error : "Could not duplicate that card.");
  }

  // The rest are separate fields with their own endpoints. The copy already
  // exists at this point, so a failure here doesn't undo it — it just
  // wouldn't have these extras.
  const extras: Promise<Response>[] = [];
  if (w.folderId !== null) extras.push(send(`/api/wallets/${id}`, "PATCH", { folderId: w.folderId }));
  if (w.signature) extras.push(send(`/api/wallets/${id}/signature`, "PUT", { signature: w.signature }));
  if (JSON.stringify(w.backDesign) !== JSON.stringify(DEFAULT_BACK_DESIGN)) {
    extras.push(send(`/api/wallets/${id}/back-design`, "PUT", { design: w.backDesign }));
  }
  await Promise.allSettled(extras);
  return id;
}
