"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useState } from "react";
import { useT } from "@/lib/language-context";
import Modal from "./Modal";
import { TrashIcon } from "@/lib/icons";

type Friend = { id: number; username: string };
type Member = { id: number; wallet_id: number; user_id: number; username: string; status: "pending" | "accepted" | "declined" };

export default function WalletShareModal({
  walletId,
  walletName,
  onClose,
}: {
  walletId: number;
  walletName: string;
  onClose: () => void;
}) {
  const t = useT();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<number | "">("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/friends")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.friends)) setFriends(data.friends);
      })
      .catch(() => {});
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  async function loadMembers() {
    const res = await fetch(`/api/wallets/${walletId}/members`);
    const data = await res.json().catch(() => null);
    if (res.ok && Array.isArray(data?.members)) setMembers(data.members);
  }

  const alreadyMemberIds = new Set(members.map((m) => m.user_id));
  const invitableFriends = friends.filter((f) => !alreadyMemberIds.has(f.id));

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (selectedFriendId === "") return;
    setInviting(true);
    setError(null);
    try {
      const res = await fetch(`/api/wallets/${walletId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: selectedFriendId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not invite that friend.");
        return;
      }
      setSelectedFriendId("");
      await loadMembers();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId: number) {
    setBusyMemberId(memberId);
    try {
      await fetch(`/api/wallet-members/${memberId}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } finally {
      setBusyMemberId(null);
    }
  }

  return (
    <Modal onClose={onClose} title={`${t("wallet.shareWallet")} — ${walletName}`}>
      <p className="mb-4 text-sm text-ink-soft">{t("wallet.shareWalletDesc")}</p>

      <form onSubmit={handleInvite} className="mb-4 flex items-center gap-2">
        <select
          value={selectedFriendId}
          onChange={(e) => setSelectedFriendId(e.target.value === "" ? "" : Number(e.target.value))}
          className="min-w-0 flex-1 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
        >
          <option value="">{t("wallet.pickFriendToInvite")}</option>
          {invitableFriends.map((f) => (
            <option key={f.id} value={f.id}>
              {f.username}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={inviting || selectedFriendId === ""}
          className="shrink-0 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
        >
          {inviting ? t("common.saving") : t("wallet.invite")}
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {members.length > 0 && (
        <div className="overflow-hidden rounded-card border border-line">
          {members.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 px-3.5 py-2.5 ${i === 0 ? "" : "border-t border-line"}`}
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{m.username}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  m.status === "accepted"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : m.status === "declined"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "bg-bg-soft text-ink-soft"
                }`}
              >
                {m.status === "accepted" ? t("wallet.memberAccepted") : m.status === "declined" ? t("wallet.memberDeclined") : t("wallet.memberPending")}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(m.id)}
                disabled={busyMemberId === m.id}
                aria-label={t("wallet.removeMember")}
                className="shrink-0 rounded-full p-1.5 text-ink-soft transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
