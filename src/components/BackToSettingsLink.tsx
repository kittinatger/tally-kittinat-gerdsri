import Link from "next/link";
import { CaretLeftIcon as PhCaretLeftIcon } from "@phosphor-icons/react/dist/ssr";

function BackIcon() {
  return <PhCaretLeftIcon weight="fill" aria-hidden="true" className="h-4 w-4 shrink-0" />;
}

// These pages (Usage guide, FAQs, Troubleshooting, etc.) are real routes
// rather than in-app Settings panels, so they don't get the panel view's
// built-in top-of-page back button for free — this is that same button,
// placed the same way, so navigating back doesn't require scrolling to
// the bottom of a long page to find a text link.
export default function BackToSettingsLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/settings"
      className={`mb-4 flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition hover:text-foreground ${className}`}
    >
      <BackIcon />
      Settings
    </Link>
  );
}
