// Creates the "Friends & sharing" and "From Tally" notifications. Each helper
// is best-effort — called from API routes inside after(), so a failure here
// never affects the action that triggered it — and createNotification itself
// skips any type the recipient switched off (see notification-types.ts).
import {
  createNotification,
  getFriendRequestRequester,
  getSplitSummary,
  getUsername,
  getWalletInvite,
  getWalletSummary,
  listWalletAudience,
  swapLastSeenAppVersion,
} from "@/lib/db";
import { RELEASES } from "@/lib/changelog-data";
import { formatCurrency } from "@/lib/format";

async function quietly(work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch {
    // Best-effort: a missed notification must never break the user's action.
  }
}

async function nameOf(userId: number): Promise<string> {
  return (await getUsername(userId)) ?? "Someone";
}

export function notifyFriendRequest(fromId: number, toId: number, autoAccepted: boolean) {
  return quietly(async () => {
    const from = await nameOf(fromId);
    await createNotification(
      toId,
      autoAccepted
        ? { type: "friend_accepted", title: `You and ${from} are now friends`, body: "You can split bills and share wallets.", url: "/settings?panel=friends" }
        : { type: "friend_request", title: `${from} sent you a friend request`, body: "Accept it to split bills and share wallets.", url: "/settings?panel=friends" },
    );
  });
}

export function notifyFriendAccepted(accepterId: number, requestId: number) {
  return quietly(async () => {
    const requesterId = await getFriendRequestRequester(requestId);
    if (!requesterId) return;
    const accepter = await nameOf(accepterId);
    await createNotification(requesterId, {
      type: "friend_accepted",
      title: `${accepter} accepted your friend request`,
      body: "You can split bills and share wallets now.",
      url: "/settings?panel=friends",
    });
  });
}

export function notifySplitAdded(creatorId: number, input: { title: string; totalAmount: number; participantIds: number[] }, currency: string) {
  return quietly(async () => {
    const creator = await nameOf(creatorId);
    const others = [...new Set(input.participantIds)].filter((id) => id !== creatorId);
    await Promise.all(
      others.map((id) =>
        createNotification(id, {
          type: "split_added",
          title: `${creator} split a bill with you`,
          body: `${input.title || "Split bill"} · ${formatCurrency(input.totalAmount, currency)} total`,
          url: "/splits",
        }),
      ),
    );
  });
}

export function notifySplitActivity(actorId: number, splitId: number, action: "accepted" | "declined" | "settled") {
  return quietly(async () => {
    const split = await getSplitSummary(splitId);
    if (!split || split.creatorId === actorId) return;
    const actor = await nameOf(actorId);
    const verb = action === "settled" ? "updated their payment on" : action;
    await createNotification(split.creatorId, {
      type: "split_activity",
      title: `${actor} ${verb} “${split.title || "Split bill"}”`,
      body: action === "settled" ? "Check who's still to pay in Split bills." : "See the split in Split bills.",
      url: "/splits",
    });
  });
}

export function notifyWalletInvite(ownerId: number, walletId: number, friendId: number) {
  return quietly(async () => {
    const [owner, wallet] = await Promise.all([nameOf(ownerId), getWalletSummary(walletId)]);
    if (!wallet) return;
    await createNotification(friendId, {
      type: "wallet_invite",
      title: `${owner} invited you to “${wallet.name}”`,
      body: "Accept to see and add to this shared wallet.",
      url: "/wallet",
    });
  });
}

export function notifyWalletInviteAnswered(userId: number, memberId: number, accepted: boolean) {
  return quietly(async () => {
    const invite = await getWalletInvite(memberId);
    if (!invite) return;
    const [member, wallet] = await Promise.all([nameOf(userId), getWalletSummary(invite.walletId)]);
    if (!wallet || wallet.ownerId === userId) return;
    await createNotification(wallet.ownerId, {
      type: "wallet_invite",
      title: `${member} ${accepted ? "joined" : "declined"} “${wallet.name}”`,
      body: accepted ? "You're now sharing this wallet." : "They won't see this wallet.",
      url: "/wallet",
    });
  });
}

export function notifyWalletActivity(actorId: number, walletId: number | null, expense: { merchant: string; amount: number; type: string }, currency: string) {
  return quietly(async () => {
    if (!walletId) return;
    const audience = (await listWalletAudience(walletId)).filter((id) => id !== actorId);
    if (audience.length === 0) return;
    const [actor, wallet] = await Promise.all([nameOf(actorId), getWalletSummary(walletId)]);
    if (!wallet) return;
    const verb = expense.type === "income" ? "added income" : expense.type === "transfer" ? "added a transfer" : "spent";
    await Promise.all(
      audience.map((id) =>
        createNotification(id, {
          type: "wallet_activity",
          title: `${actor} ${verb} in “${wallet.name}”`,
          body: `${expense.merchant} · ${formatCurrency(expense.amount, currency)}`,
          url: "/",
        }),
      ),
    );
  });
}

// Tells each user once about the newest release. A brand-new account just
// records the current version (there's nothing "new" to them yet); an older
// account that was never tracked hears about the current release once.
export function ensureAppUpdateNotification(userId: number) {
  return quietly(async () => {
    const latest = RELEASES[0];
    if (!latest) return;
    const { changed, previous, established } = await swapLastSeenAppVersion(userId, latest.version);
    if (!changed || (previous === null && !established)) return;
    const items = latest.sections.flatMap((s) => s.items);
    // Each highlight's first sentence, one per line — the inbox lists them.
    const highlights = items.slice(0, 4).map((item) => item.split(/(?<=\.)\s|:\s/)[0].replace(/\.$/, ""));
    await createNotification(userId, {
      type: "app_update",
      title: `Tally ${latest.version} is here`,
      body: highlights.join("\n"),
      url: "/changelog",
    });
  });
}
