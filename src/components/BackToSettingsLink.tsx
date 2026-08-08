import Link from "next/link";

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <path d="M12.5 4.5l-6 5.5 6 5.5" />
    </svg>
  );
}

// These pages (Usage guide, FAQs, Troubleshooting, etc.) are real routes
// rather than in-app Settings panels, so they don't get the panel view's
// built-in top-of-page back button for free — this is that same button,
// placed the same way, so navigating back doesn't require scrolling to
// the bottom of a long page to find a text link.
export default function BackToSettingsLink() {
  return (
    <Link
      href="/settings"
      className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition hover:text-foreground"
    >
      <BackIcon />
      Settings
    </Link>
  );
}
