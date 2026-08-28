// Shared icon set for the whole app. Every icon here is a thin-stroke line
// glyph (viewBox 0 0 20 20, strokeWidth 1.6, round caps/joins, fill="none")
// so the app reads as one visual language instead of a mix of hand-traced
// filled icon-font glyphs and line icons. Category icons (below) replace the
// old emoji picker with the same stroke style, keyed by a short string
// stored on the category record.

import { isCategoryIconKey, type CategoryIconKey } from "./category-icons";

type IconProps = { className?: string };

function base(className: string | undefined, fallback: string) {
  return className ?? fallback;
}

// ---- Common action icons -------------------------------------------------

export function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M4 5.5h12M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5.5 5.5 6 16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l.5-10.5" />
    </svg>
  );
}

export function EditIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M13.6 3.6a2 2 0 0 1 2.8 2.8l-8.5 8.5a2 2 0 0 1-.85.5l-3 .86.86-3a2 2 0 0 1 .5-.85Z" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10 3.5v13M3.5 10h13" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

// Points down by default — rotate via className (rotate-90 / -rotate-90 /
// rotate-180) for right/left/up orientations instead of drawing separate
// icons per direction.
export function ChevronIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M5 7.5l5 5 5-5" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M12.5 4.5l-6 5.5 6 5.5" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M7.5 4.5l6 5.5-6 5.5" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <circle cx="8.7" cy="8.7" r="5.5" />
      <path d="M16.5 16.5l-3.6-3.6" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10 3v9.5M6 9l4 4 4-4" />
      <path d="M4 15.5h12" />
    </svg>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10 12.5V3M6 7l4-4 4 4" />
      <path d="M4 15.5h12" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M3 9.5 10 3l7 6.5" />
      <path d="M5 8v8h10V8" />
      <path d="M8 16v-4h4v4" />
    </svg>
  );
}

export function ListIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M4 6h12M4 10h12M4 14h8" />
    </svg>
  );
}

// Bar chart glyph — used for the Analytics nav link.
export function AnalyticsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M3.5 16.5v-6M9.5 16.5v-10M15.5 16.5v-4" />
      <path d="M2.5 16.5h15" />
    </svg>
  );
}

// A landscape photo shape (frame with a mountain/sun glyph) — used for the
// "choose from photo gallery" action.
export function ImageIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
      <circle cx="7" cy="8" r="1.4" fill="currentColor" stroke="none" />
      <path d="M4 15l4.5-4.5a1.5 1.5 0 0 1 2.1 0L14 14M12.5 12.5l1-1a1.5 1.5 0 0 1 2.1 0l1.9 1.9" />
    </svg>
  );
}

// A ticket/pass shape (rounded card with a perforated tear line) — used for
// the Memberships nav item and card-related UI, distinct from WalletIcon.
// A camera body with a lens circle — used for the live-scan entry tile.
export function CameraIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M3 7a1.5 1.5 0 0 1 1.5-1.5h1.4l.8-1.3a1 1 0 0 1 .85-.5h4.9a1 1 0 0 1 .85.5l.8 1.3h1.4A1.5 1.5 0 0 1 17 7v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14Z" />
      <circle cx="10" cy="10.5" r="3" />
    </svg>
  );
}

// A generic document/file shape — used for the "from file" entry tile.
export function FileIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M5.5 2.5h6l3 3v11a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z" />
      <path d="M11.5 2.5v3h3" />
    </svg>
  );
}

export function MembershipCardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="M7.5 4.5v11" strokeDasharray="1.6 1.8" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export function MicIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <rect x="7" y="2.5" width="6" height="10" rx="3" />
      <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M3 8h14M7 2.5v3M13 2.5v3" />
    </svg>
  );
}

// A paint palette with a few "blob" dots — used as the Appearance/color
// section header in the redesigned add-pass/add-card/add-wallet forms.
export function PaletteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10 2.5a7.5 7.5 0 1 0 0 15 1.7 1.7 0 0 0 1.2-2.9 1.7 1.7 0 0 1 1.2-2.9H14a3.5 3.5 0 0 0 3.5-3.5C17.5 4.5 14.5 2.5 10 2.5Z" />
      <circle cx="6.8" cy="8.2" r="1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="6.2" r="1" fill="currentColor" stroke="none" />
      <circle cx="13.2" cy="8.2" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// A small price/luggage tag — used as the "core details" section header.
export function TagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10.5 3H16a1 1 0 0 1 1 1v5.5a1 1 0 0 1-.3.7l-6.7 6.7a1 1 0 0 1-1.4 0l-5.5-5.5a1 1 0 0 1 0-1.4l6.7-6.7a1 1 0 0 1 .7-.3Z" />
      <circle cx="13.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// A four-point sparkle — used for the "Generate an AI pattern" action.
export function SparkleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10 2.5c.5 3 2.2 4.7 5.2 5.2-3 .5-4.7 2.2-5.2 5.2-.5-3-2.2-4.7-5.2-5.2 3-.5 4.7-2.2 5.2-5.2Z" />
      <path d="M15.8 14c.25 1.2.9 1.85 2.1 2.1-1.2.25-1.85.9-2.1 2.1-.25-1.2-.9-1.85-2.1-2.1 1.2-.25 1.85-.9 2.1-2.1Z" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  );
}

// Renders both light/dark glyphs always and lets the `dark:` CSS variant
// pick which one shows, so it matches server-rendered HTML with no
// hydration mismatch (see SettingsMenu.tsx, the original home of this
// component, for why that matters pre-login).
export function SunMoonIcon({ className }: IconProps) {
  return (
    <>
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`${base(className, "h-5 w-5")} dark:hidden`}>
        <circle cx="10" cy="10" r="3.5" />
        <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" />
      </svg>
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`hidden ${base(className, "h-5 w-5")} dark:block`}>
        <path d="M16.5 11.8A6.8 6.8 0 0 1 8.2 3.5a7 7 0 1 0 8.3 8.3Z" />
      </svg>
    </>
  );
}

// ---- Category icons -------------------------------------------------------
// Replaces the old free-pick emoji list. Each category stores a short key
// (see CATEGORY_ICON_KEYS) instead of an emoji string; unrecognized/legacy
// values (old emoji saved before this change) simply render nothing and the
// caller falls back to its usual monogram/dot treatment.

function CartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <circle cx="7.5" cy="16.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="16.5" r="1.1" fill="currentColor" stroke="none" />
      <path d="M2 3h2l1.6 9.6a1.5 1.5 0 0 0 1.5 1.4h7.6a1.5 1.5 0 0 0 1.5-1.2L17.5 6H5.2" />
    </svg>
  );
}

function BurgerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M3 7.8c0-2.4 3.1-4.3 7-4.3s7 1.9 7 4.3" />
      <path d="M2.7 9.7h14.6M3 12.3h14" />
      <path d="M3.3 14.3a1.6 1.6 0 0 0 1.6 1.7h10.2a1.6 1.6 0 0 0 1.6-1.7" />
    </svg>
  );
}

function CoffeeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M4 8h9.5v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" />
      <path d="M13.5 9h1.3a2 2 0 0 1 0 4h-1.3" />
      <path d="M6.5 3.5c-.5.8-.5 1.3 0 2M9.5 3.5c-.5.8-.5 1.3 0 2" />
    </svg>
  );
}

function CarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M3.2 13V11l1.4-3.6A1.4 1.4 0 0 1 5.9 6.5h8.2a1.4 1.4 0 0 1 1.3.9L16.8 11v2" />
      <path d="M2.8 13h14.4v1.4a.9.9 0 0 1-.9.9h-.9a.9.9 0 0 1-.9-.9V14H5.5v.4a.9.9 0 0 1-.9.9h-.9a.9.9 0 0 1-.9-.9Z" />
      <circle cx="6.2" cy="13" r=".9" fill="currentColor" stroke="none" />
      <circle cx="13.8" cy="13" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <rect x="3" y="3.5" width="14" height="10" rx="2" />
      <path d="M3 8.5h14M6 13.5v2M14 13.5v2" />
      <circle cx="6.3" cy="16" r=".9" fill="currentColor" stroke="none" />
      <circle cx="13.7" cy="16" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PlaneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M17.5 2.5 2.5 8.8l5.4 2.1M17.5 2.5 11.3 17.5l-3.4-6.6M17.5 2.5 7.9 10.9" />
    </svg>
  );
}

function BulbIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10 2.8a4.7 4.7 0 0 0-2.7 8.5c.5.4.7.9.7 1.5v.2h4v-.2c0-.6.3-1.1.7-1.5A4.7 4.7 0 0 0 10 2.8Z" />
      <path d="M8.3 15.5h3.4M8.7 17.2h2.6" />
    </svg>
  );
}

function ShieldCategoryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10 2.5l6 2.2v4.8c0 4.2-2.6 6.9-6 8-3.4-1.1-6-3.8-6-8V4.7Z" />
    </svg>
  );
}

function MovieIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <rect x="3" y="7" width="14" height="9.5" rx="1.5" />
      <path d="M3 7l1.8-3.5h2.4L5.6 7M7.6 7l1.8-3.5h2.4L9.8 7M12.2 7l1.8-3.5h2.4L14.6 7" />
    </svg>
  );
}

function GameIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <rect x="2.5" y="6.5" width="15" height="8" rx="4" />
      <path d="M6.5 9v3M5 10.5h3" />
      <circle cx="13" cy="9.5" r=".9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11.5" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BookCategoryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10 5.2C8.9 4 7 3.3 3.5 3.3v11c3.5 0 5.4.7 6.5 1.9 1.1-1.2 3-1.9 6.5-1.9v-11C13 3.3 11.1 4 10 5.2Z" />
      <path d="M10 5.2v11.5" />
    </svg>
  );
}

function HealthIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <rect x="3" y="3" width="14" height="14" rx="3" />
      <path d="M10 6.5v7M6.5 10h7" />
    </svg>
  );
}

function PillIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M4.8 15.2a3.2 3.2 0 0 1 0-4.5l6-6a3.2 3.2 0 1 1 4.5 4.5l-6 6a3.2 3.2 0 0 1-4.5 0Z" />
      <path d="M8.8 8.2l3 3" />
    </svg>
  );
}

function BeautyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10 2.5l1.3 4.2 4.2 1.3-4.2 1.3-1.3 4.2-1.3-4.2-4.2-1.3 4.2-1.3Z" />
      <path d="M15.5 13.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6Z" />
    </svg>
  );
}

function BabyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M8 3.5h4v2.3a2 2 0 0 1 1.5 1.9v6.8a2.5 2.5 0 0 1-2.5 2.5h-2A2.5 2.5 0 0 1 6.5 14.5V7.7A2 2 0 0 1 8 5.8Z" />
      <path d="M7 9.5h6M7 11.8h6" />
    </svg>
  );
}

function PetIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <circle cx="10" cy="12.3" r="2.6" />
      <circle cx="5.3" cy="8.3" r="1.3" />
      <circle cx="9.3" cy="5.6" r="1.3" />
      <circle cx="13.6" cy="5.8" r="1.3" />
      <circle cx="15.7" cy="9.5" r="1.3" />
    </svg>
  );
}

function GiftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <rect x="3" y="7.5" width="14" height="3.2" rx="1" />
      <rect x="4" y="10.7" width="12" height="6.3" rx="1" />
      <path d="M10 7.5v9.5" />
      <path d="M7 7.3c-1.3-2-.6-4 1.3-3.3.9.3 1.5 1.6 1.7 3.3M13 7.3c1.3-2 .6-4-1.3-3.3-.9.3-1.5 1.6-1.7 3.3" />
    </svg>
  );
}

function GradCapIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10 4 2.5 7.5 10 11l7.5-3.5Z" />
      <path d="M5.5 9.2v3.8c0 1 2 2.3 4.5 2.3s4.5-1.3 4.5-2.3V9.2" />
      <path d="M17.5 7.5v4.2" />
    </svg>
  );
}

function FitnessIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M5 7.5v5M15 7.5v5M3.5 8.7v2.6M16.5 8.7v2.6M6.6 10h6.8" />
    </svg>
  );
}

function ArtIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10 3a7 6.3 0 0 0 0 12.6c1 0 1.6-.5 1.6-1.3 0-.4-.2-.7-.2-1.1 0-.7.6-1.2 1.3-1.2h1.5c1.8 0 3.3-1.4 3.3-3.4C17.5 5.4 14.1 3 10 3Z" />
      <circle cx="6.2" cy="8.7" r=".9" fill="currentColor" stroke="none" />
      <circle cx="8.6" cy="6.3" r=".9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6.5" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MusicIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M8 14.5V4.5l7-1.5v10" />
      <circle cx="6.3" cy="14.5" r="2" />
      <circle cx="13.3" cy="13" r="2" />
    </svg>
  );
}

function PhoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <rect x="6" y="2.5" width="8" height="15" rx="2" />
      <path d="M9 15.2h2" />
    </svg>
  );
}

function ReceiptCategoryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M5 2.5h10v15l-2-1.3-1.5 1.3-1.5-1.3-1.5 1.3-1.5-1.3-2 1.3v-15Z" />
      <path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3" />
    </svg>
  );
}

function ToolIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M13.8 3.7a4.2 4.2 0 0 0-5.6 5.1L3.4 13.6l3 3 4.8-4.8a4.2 4.2 0 0 0 5.1-5.6l-2.7 2.7-2.1-2.1Z" />
    </svg>
  );
}

function BoxIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10 2.8 17 6.5v7L10 17.2 3 13.5v-7Z" />
      <path d="M3 6.5 10 10.2 17 6.5M10 10.2v7" />
    </svg>
  );
}

function ShirtIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M7 3.5 4 5.3 5.6 8 7 7.1V16.5h6V7.1l1.4.9L16 5.3 13 3.5c-.5 1-1.6 1.7-3 1.7s-2.5-.7-3-1.7Z" />
    </svg>
  );
}

function CardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="M2.5 8h15M5 12.3h4" />
    </svg>
  );
}

function CashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <rect x="2.5" y="5.5" width="15" height="9" rx="1.5" />
      <circle cx="10" cy="10" r="2" />
      <path d="M4.8 5.5a2.3 2.3 0 0 1-2.3 2.3M15.2 5.5a2.3 2.3 0 0 0 2.3 2.3M4.8 14.5a2.3 2.3 0 0 0-2.3-2.3M15.2 14.5a2.3 2.3 0 0 1 2.3-2.3" />
    </svg>
  );
}

function BankIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M10 2.5 17.5 7H2.5Z" />
      <path d="M3 7v8M6.3 7v8M10 7v8M13.7 7v8M17 7v8" />
      <path d="M2.5 17.5h15" />
    </svg>
  );
}

function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M3 15 8 9.5l3 2.5 6-6.5" />
      <path d="M13.5 5.5H17.5V9.5" />
    </svg>
  );
}

function WineIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base(className, "h-4 w-4")}>
      <path d="M6 3h8l-1 6.5a3 3 0 0 1-6 0Z" />
      <path d="M10 12.5V17M7 17h6" />
    </svg>
  );
}

export const CATEGORY_ICON_COMPONENTS: Record<CategoryIconKey, React.ComponentType<IconProps>> = {
  cart: CartIcon,
  burger: BurgerIcon,
  coffee: CoffeeIcon,
  car: CarIcon,
  bus: BusIcon,
  plane: PlaneIcon,
  home: HomeIcon,
  bulb: BulbIcon,
  shield: ShieldCategoryIcon,
  movie: MovieIcon,
  game: GameIcon,
  book: BookCategoryIcon,
  health: HealthIcon,
  pill: PillIcon,
  beauty: BeautyIcon,
  baby: BabyIcon,
  pet: PetIcon,
  gift: GiftIcon,
  gradcap: GradCapIcon,
  fitness: FitnessIcon,
  art: ArtIcon,
  music: MusicIcon,
  phone: PhoneIcon,
  receipt: ReceiptCategoryIcon,
  tool: ToolIcon,
  box: BoxIcon,
  shirt: ShirtIcon,
  card: CardIcon,
  cash: CashIcon,
  bank: BankIcon,
  chart: ChartIcon,
  wine: WineIcon,
};

/**
 * Renders a category's icon by key, or nothing if the key is missing or
 * unrecognized (e.g. an emoji saved under the old picker, before this
 * change) — callers are expected to fall back to their usual monogram/dot
 * treatment in that case rather than rendering raw emoji text.
 */
export function CategoryIcon({ iconKey, className }: { iconKey: string | null | undefined; className?: string }) {
  if (!iconKey || !isCategoryIconKey(iconKey)) return null;
  const Icon = CATEGORY_ICON_COMPONENTS[iconKey];
  return <Icon className={className} />;
}
