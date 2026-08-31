// Gemini calls cost money — every interactive AI feature (receipt scan,
// voice entry, the assistant, card-pattern generation) shares this one
// daily cap rather than each having its own, tracked via countRecentGeminiUsage
// in db.ts. Previously duplicated as a local constant in each of those 4
// route files; centralized here so it's one number to change, and so the
// new AI usage panel (AiUsagePanel.tsx) shows the same limit the routes
// actually enforce rather than a second hardcoded copy that could drift.
export const MAX_GEMINI_CALLS_PER_DAY = 60;
