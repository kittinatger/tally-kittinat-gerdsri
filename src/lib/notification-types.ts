// Every kind of in-app notification Tally sends, grouped the way the
// Notifications settings page shows them — each one can be switched off on
// its own (stored per user in app_settings.notification_prefs; see
// lib/db.ts). Client-safe: no server imports.

export type NotificationType =
  | "recurring_logged"
  | "budget_over_limit"
  | "loan_due"
  | "friend_request"
  | "friend_accepted"
  | "split_added"
  | "split_activity"
  | "wallet_invite"
  | "wallet_activity"
  | "app_update";

export type NotificationGroup = "money" | "social" | "tally";

export type NotificationTypeInfo = {
  type: NotificationType;
  group: NotificationGroup;
  title: string;
  description: string;
};

export const NOTIFICATION_GROUPS: { group: NotificationGroup; title: string; description: string }[] = [
  { group: "money", title: "Your money", description: "Budgets, recurring payments and what's due." },
  { group: "social", title: "Friends & sharing", description: "Friends, split bills and shared wallets." },
  { group: "tally", title: "From Tally", description: "New versions and what they add." },
];

export const NOTIFICATION_TYPES: NotificationTypeInfo[] = [
  {
    type: "recurring_logged",
    group: "money",
    title: "Recurring transactions logged",
    description: "When rent, salary or a subscription is added for you automatically.",
  },
  {
    type: "budget_over_limit",
    group: "money",
    title: "Over budget",
    description: "Once a month, the first time a category goes over its budget.",
  },
  {
    type: "loan_due",
    group: "money",
    title: "Loan payments due",
    description: "When a loan installment is coming up.",
  },
  {
    type: "friend_request",
    group: "social",
    title: "Friend requests",
    description: "When someone wants to add you as a friend.",
  },
  {
    type: "friend_accepted",
    group: "social",
    title: "Accepted requests",
    description: "When someone accepts your friend request.",
  },
  {
    type: "split_added",
    group: "social",
    title: "New split bills",
    description: "When a friend splits a bill with you.",
  },
  {
    type: "split_activity",
    group: "social",
    title: "Split bill updates",
    description: "When people accept, decline or settle a bill you split.",
  },
  {
    type: "wallet_invite",
    group: "social",
    title: "Shared wallet invites",
    description: "When a friend invites you to a wallet, and when they answer yours.",
  },
  {
    type: "wallet_activity",
    group: "social",
    title: "Shared wallet activity",
    description: "When someone adds a transaction to a wallet you share.",
  },
  {
    type: "app_update",
    group: "tally",
    title: "Updates & new features",
    description: "When a new version of Tally is out, with what changed.",
  },
];

export function notificationTypeInfo(type: string): NotificationTypeInfo | undefined {
  return NOTIFICATION_TYPES.find((n) => n.type === type);
}

/** Types switched off by the user; anything not listed is on. */
export type NotificationPrefs = Partial<Record<NotificationType, boolean>>;

export function isNotificationTypeOn(prefs: NotificationPrefs, type: NotificationType): boolean {
  return prefs[type] !== false;
}
