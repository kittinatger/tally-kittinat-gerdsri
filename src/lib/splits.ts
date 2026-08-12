// Shared between lib/db.ts and lib/validation.ts — kept in its own module
// (rather than defined in db.ts) so validation.ts can import the enum
// values without creating a circular import with db.ts. Same pattern as
// lib/challenges.ts.

export const SPLIT_METHODS = ["equal", "custom"] as const;
export type SplitMethod = (typeof SPLIT_METHODS)[number];

export const SPLIT_PAYMENT_METHODS = ["single_payer", "itemized"] as const;
export type SplitPaymentMethod = (typeof SPLIT_PAYMENT_METHODS)[number];
