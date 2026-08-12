// Shared between lib/db.ts and lib/validation.ts — kept in its own module
// (rather than defined in db.ts) so validation.ts can import the enum
// values without creating a circular import with db.ts.

export const CHALLENGE_TYPES = ["savings", "spending_limit", "no_spend_days"] as const;
export type ChallengeType = (typeof CHALLENGE_TYPES)[number];

export const CHALLENGE_MODES = ["collaborative", "competitive"] as const;
export type ChallengeMode = (typeof CHALLENGE_MODES)[number];
