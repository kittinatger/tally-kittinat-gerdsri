// The canonical set of tables a "full data backup" covers, and how to
// safely round-trip them through export → encrypted file → import.
//
// Deliberately excludes:
// - Binary columns (expenses.receipt_image, expense_receipts,
//   membership_cards.logo_image/banner_image, users.profile_picture) —
//   backing these up as base64 inside one JSON file would bloat it
//   dramatically for little benefit; a receipt photo is reproducible by
//   re-scanning, unlike the transaction data itself.
// - Tables that reference *other users* (splits/split_participants,
//   friend_requests, family_members, wallet_members, challenges/
//   challenge_participants/challenge_reveal_requests) — a backup restores
//   one account's own data; re-inserting a row that points at someone
//   else's account id (which may not exist, or may belong to a different
//   person, on whatever account it's imported into) would silently create
//   wrong or dangling relationships. loans is included, but with its
//   optional counterparty_friend_id always nulled out on import for the
//   same reason (counterparty_name is preserved as the fallback label).
// - app_settings is handled specially: there is always already exactly one
//   row per account (seeded at registration), so importing it means
//   UPDATE-in-place, not INSERT — see importBackup.

export type BackupColumn = {
  name: string;
  /** If set, this column is a foreign key into another backed-up table
   * (by that table's export name) and must be remapped through the
   * old-id → new-id map built during import, not copied verbatim. */
  refTable?: string;
  /** If true, an unresolvable ref (id not found in this backup, or a
   * counterparty that intentionally isn't remapped) is set to null on
   * import instead of failing the whole row. */
  nullableRef?: boolean;
};

export type BackupTable = {
  /** Table name, and the key this table's rows sit under in the backup
   * JSON's `tables` object. */
  name: string;
  /** Columns copied verbatim (or remapped, if refTable is set) — never
   * includes `id` (always regenerated) or `user_id` (always the importing
   * user, added separately). */
  columns: BackupColumn[];
  /** Unique constraints (besides the primary key) that an insert could
   * collide with, e.g. categories' (user_id, type, name) — these use
   * ON CONFLICT DO NOTHING and count as "skipped", not "errored". */
  hasUniqueConflict?: boolean;
  /** Set when the table has no user_id column of its own and ownership is
   * only reachable by joining a parent table (loan_installments → loans).
   * Export filters via this join; import doesn't need it since the parent
   * row's id is already remapped by the time this table imports. */
  ownerJoin?: { parentTable: string; parentIdColumn: string };
};

// Insert order matters: a table listing another as a refTable must come
// after it, so that table's old-id → new-id map is already built.
export const BACKUP_TABLES: BackupTable[] = [
  {
    name: "categories",
    columns: [
      { name: "type" },
      { name: "name" },
      { name: "color" },
      { name: "sort_order" },
      { name: "icon" },
    ],
    hasUniqueConflict: true,
  },
  {
    name: "wallets",
    columns: [
      { name: "name" },
      { name: "color" },
      { name: "starting_balance" },
      { name: "starting_balance_set_at" },
      { name: "sort_order" },
      { name: "kind" },
      { name: "archived" },
      { name: "currency" },
      { name: "background" },
      { name: "text_color" },
      // is_default is deliberately excluded — the importing account
      // already has its own default wallet; a restored wallet never
      // silently takes over that role.
      // Payment-card visuals — folded in from the old standalone
      // wallet_cards table (see the wallets migration comments in db.ts).
      { name: "holder_name" },
      { name: "last4" },
      { name: "expiry_month" },
      { name: "expiry_year" },
      { name: "network" },
      { name: "show_network_badge" },
      { name: "badge_position" },
      { name: "icon_color" },
      { name: "show_chip" },
      { name: "chip_color" },
      { name: "chip_position" },
      { name: "notes" },
      { name: "show_balance" },
      { name: "show_currency" },
      { name: "show_card_number" },
      { name: "show_name" },
      { name: "show_holder_name" },
      { name: "show_expiry" },
    ],
  },
  {
    name: "expenses",
    columns: [
      { name: "date" },
      { name: "amount" },
      { name: "merchant" },
      { name: "category" },
      { name: "notes" },
      { name: "type" },
      { name: "tags" },
      { name: "direction" },
      { name: "wallet_id", refTable: "wallets", nullableRef: true },
      // transfer_group_id / split_group_id are left as-is (opaque grouping
      // strings, not foreign keys) so paired transfer legs and split-bill
      // lines that were both exported still visually group together after
      // import — they just don't point at any other backed-up table.
      { name: "transfer_group_id" },
      { name: "split_group_id" },
    ],
  },
  {
    name: "recurring_rules",
    columns: [
      { name: "type" },
      { name: "direction" },
      { name: "amount" },
      { name: "merchant" },
      { name: "category" },
      { name: "notes" },
      { name: "wallet_id", refTable: "wallets", nullableRef: true },
      { name: "frequency" },
      { name: "next_run_date" },
      { name: "active" },
      { name: "sort_order" },
    ],
  },
  {
    name: "budgets",
    columns: [
      { name: "category" },
      { name: "monthly_limit" },
      { name: "dismissed_alert_month" },
      { name: "rollover" },
      { name: "notified_alert_month" },
    ],
    hasUniqueConflict: true,
  },
  {
    name: "savings_goals",
    columns: [
      { name: "name" },
      { name: "color" },
      { name: "target_amount" },
      { name: "current_amount" },
      { name: "sort_order" },
    ],
  },
  {
    name: "savings_goal_contributions",
    columns: [{ name: "goal_id", refTable: "savings_goals" }, { name: "delta" }, { name: "created_at" }],
  },
  {
    name: "loans",
    columns: [
      // counterparty_friend_id is never included — see file header.
      { name: "counterparty_name" },
      { name: "direction" },
      { name: "principal" },
      { name: "notes" },
    ],
  },
  {
    name: "loan_installments",
    columns: [{ name: "loan_id", refTable: "loans" }, { name: "due_date" }, { name: "amount" }, { name: "paid" }, { name: "paid_at" }],
    ownerJoin: { parentTable: "loans", parentIdColumn: "loan_id" },
  },
  {
    name: "membership_cards",
    columns: [
      { name: "name" },
      { name: "code_value" },
      { name: "code_format" },
      { name: "color" },
      { name: "icon" },
      { name: "notes" },
      { name: "sort_order" },
      { name: "template" },
      { name: "fields" },
      { name: "layout" },
      { name: "category" },
      { name: "background" },
      { name: "text_color" },
    ],
  },
  // wallet_cards is deliberately not exported — it's retired (see the
  // wallets migration comments in db.ts); every row it ever had was
  // one-time-copied onto `wallets`, which is backed up above, so exporting
  // it too would just duplicate the same cards under two table names.
];

export const BACKUP_TABLE_NAMES = new Set(BACKUP_TABLES.map((t) => t.name));

// app_settings columns applied on import via UPDATE, not INSERT — see
// importBackup.
export const APP_SETTINGS_BACKUP_COLUMNS = [
  "starting_balance",
  "starting_balance_set_at",
  "currency",
  "auto_convert_currency",
  "language",
  "convert_wallet_balances",
  "notify_recurring_email",
  "notify_budget_email",
  "week_start_day",
  "month_start_day",
  "biweekly_anchor_date",
  "default_view",
  "timezone",
  "show_week_numbers",
  "alternate_calendar",
  "dashboard_widgets",
  "require_split_confirmation",
] as const;
