"use client";

import Link from "next/link";
import type { NavBarStyleConfig } from "@/lib/nav-bar-styles";
import { PlusIcon } from "@/lib/icons";

export type NavBarLink = { href: string; label: string; icon: React.ReactNode };

// The one renderer behind every selectable nav-bar style (Settings > Nav
// bar style) — reads a NavBarStyleConfig and switches on its handful of
// axes instead of being 24 separate components. `config.floating`'s
// values reproduce AppHeader's original (pre-this-feature) bottom nav
// exactly, so the shipped default looks unchanged.
//
// `preview`/`activeHref` let the Settings picker render this exact same
// component non-interactively (plain elements instead of real `Link`s, a
// fixed "active" tab) so every preview card is pixel-accurate to what
// picking that style actually produces, instead of a separately
// maintained mock.
export default function BottomNavBar({
  config,
  links,
  pathname,
  showAdd = false,
  onAddClick,
  preview = false,
  activeHref,
}: {
  config: NavBarStyleConfig;
  links: NavBarLink[];
  pathname: string;
  showAdd?: boolean;
  onAddClick?: () => void;
  preview?: boolean;
  activeHref?: string;
}) {
  const hasAdd = showAdd || Boolean(onAddClick);
  const activePath = preview ? (activeHref ?? links[0]?.href) : pathname;
  const inlineCta = hasAdd && (config.cta === "overlapCircle" || config.cta === "overlapDiamond" || config.cta === "inlineCircle" || config.cta === "inlineCircleLight");
  const externalCta = hasAdd && !inlineCta;
  const white = config.accent === "white";

  // Split 2+CTA+2 for the four inline-CTA treatments; every other style
  // (including these same four when there's no Add action to show) is a
  // plain, evenly-spaced row of every link.
  const leftLinks = inlineCta ? links.slice(0, 2) : links;
  const rightLinks = inlineCta ? links.slice(2) : [];

  const shapeClass = config.shape === "pill" ? "rounded-full" : config.shape === "dock" ? "rounded-[28px]" : "rounded-2xl";
  const backgroundClass =
    config.background === "glass"
      ? "border border-[var(--glass-border)] bg-[image:var(--glass-bg)] backdrop-blur-xl shadow-soft"
      : config.background === "glassGradient"
        ? "border border-white/30 bg-gradient-to-r from-blue-500/70 via-indigo-500/60 to-violet-500/70 backdrop-blur-xl shadow-soft"
        : config.background === "gradient"
          ? "bg-gradient-to-r from-navy to-violet-600 shadow-soft"
          : config.background === "neumorphic"
            ? "bg-bg-soft shadow-[6px_6px_14px_rgba(0,0,0,0.08),-6px_-6px_14px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.45),-6px_-6px_14px_rgba(255,255,255,0.04)]"
            : config.background === "outline"
              ? "border-2 border-line bg-transparent"
              : config.background === "trackSoft"
                ? "bg-bg-soft"
                : "border border-line bg-surface shadow-soft"; // solid, twoTone (tint layered on top separately)

  return (
    <div className={`${preview ? "relative" : "fixed inset-x-3 bottom-3 z-20"} flex items-center gap-2 ${preview ? "" : "sm:hidden"}`}>
      {config.attach === "floating" && (
        <div
          aria-hidden="true"
          className={`flex shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] shadow-soft backdrop-blur-xl ${
            preview ? "h-8 w-8" : "h-[46px] w-[46px]"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG mark, not a build-time asset */}
          <img src="/favicon-light.svg" alt="" className={`shrink-0 dark:hidden ${preview ? "h-4 w-4" : "h-6 w-6"}`} />
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG mark, not a build-time asset */}
          <img src="/favicon-dark.svg" alt="" className={`hidden shrink-0 dark:block ${preview ? "h-4 w-4" : "h-6 w-6"}`} />
        </div>
      )}

      <nav
        className={`relative flex flex-1 items-center ${preview ? "gap-0.5 p-1" : "gap-1 p-1.5"} ${shapeClass} ${backgroundClass} ${config.elevated ? "shadow-[0_16px_32px_-8px_rgba(0,0,0,0.28)]" : ""}`}
      >
        {config.background === "twoTone" && (
          <span
            aria-hidden="true"
            className={`absolute inset-y-1.5 w-1/2 rounded-xl bg-bg-soft transition-all ${
              links.findIndex((l) => l.href === activePath) < links.length / 2 ? "left-1.5" : "right-1.5"
            }`}
          />
        )}
        {config.indicator === "trackUnderline" && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-3 bottom-1.5 h-[3px] rounded-full bg-line/40" />
        )}

        {leftLinks.map((link) => (
          <NavTab key={link.href} link={link} active={link.href === activePath} config={config} preview={preview} white={white} />
        ))}

        {inlineCta && (
          <CtaSlot cta={config.cta} onAddClick={onAddClick} preview={preview} />
        )}

        {rightLinks.map((link) => (
          <NavTab key={link.href} link={link} active={link.href === activePath} config={config} preview={preview} white={white} />
        ))}
      </nav>

      {externalCta && (
        <button
          type="button"
          onClick={onAddClick}
          aria-label="Add transaction"
          disabled={preview}
          className={`flex shrink-0 items-center justify-center rounded-full border border-[var(--fab-glass-border)] bg-[image:var(--fab-glass-bg)] text-white shadow-[var(--shadow-soft),var(--fab-glass-shadow)] backdrop-blur-xl transition hover:brightness-110 ${
            preview ? "h-8 w-8" : "h-[46px] w-[46px]"
          }`}
        >
          <PlusIcon className={preview ? "h-3 w-3 shrink-0" : "h-4 w-4 shrink-0"} />
        </button>
      )}
    </div>
  );
}

function CtaSlot({
  cta,
  onAddClick,
  preview,
}: {
  cta: NavBarStyleConfig["cta"];
  onAddClick?: () => void;
  preview: boolean;
}) {
  const overlap = cta === "overlapCircle" || cta === "overlapDiamond";
  const light = cta === "inlineCircleLight";
  const diamond = cta === "overlapDiamond";
  return (
    <div className="flex shrink-0 items-center justify-center" style={{ width: preview ? "1.75rem" : "2.5rem" }}>
      <button
        type="button"
        onClick={onAddClick}
        disabled={preview}
        aria-label="Add transaction"
        className={`flex shrink-0 items-center justify-center text-white shadow-soft transition hover:brightness-110 ${preview ? "h-7 w-7" : "h-11 w-11"} ${
          overlap ? (preview ? "-mt-4" : "-mt-7") : ""
        } ${diamond ? "rotate-45 rounded-xl bg-gradient-to-br from-navy to-blue-500" : "rounded-full"} ${
          !diamond && light ? "bg-white text-navy" : !diamond ? "bg-navy" : ""
        }`}
      >
        <span className={diamond ? "-rotate-45" : ""}>
          <PlusIcon className={preview ? "h-2.5 w-2.5 shrink-0" : "h-4 w-4 shrink-0"} />
        </span>
      </button>
    </div>
  );
}

function NavTab({
  link,
  active,
  config,
  preview,
  white,
}: {
  link: NavBarLink;
  active: boolean;
  config: NavBarStyleConfig;
  preview: boolean;
  white: boolean;
}) {
  const showLabel = config.labels === "all" || (config.labels === "activeOnly" && active);

  const inactiveTextClass = white ? "text-white/70" : "text-ink-soft";
  const activeTextClass = white ? "text-white" : "text-navy dark:text-blue-300";

  const py = preview ? "py-1.5" : "py-2.5";
  const pyTight = preview ? "py-1" : "py-2";
  const labelSize = preview ? "text-[7px]" : "text-[10px]";
  const fillLabelSize = preview ? "text-[9px]" : "text-xs";
  const fillPadX = preview ? "px-1.5" : "px-3.5";

  let iconNode = link.icon;
  let wrapperClass = `flex flex-1 flex-col items-center justify-center gap-1 rounded-full ${py} ${labelSize} font-semibold transition ${
    active ? activeTextClass : inactiveTextClass
  }`;

  if (config.indicator === "fill") {
    wrapperClass = `flex flex-1 items-center justify-center gap-1.5 rounded-full ${py} ${fillLabelSize} font-semibold transition ${
      active
        ? white
          ? `bg-white ${fillPadX} text-navy shadow-sm`
          : `bg-surface ${fillPadX} text-foreground shadow-sm`
        : `${preview ? "px-1" : "px-2"} ${inactiveTextClass} hover:text-foreground`
    }`;
  } else if (config.indicator === "color") {
    wrapperClass = `flex flex-1 flex-col items-center justify-center gap-1 ${pyTight} ${labelSize} font-semibold transition ${
      active ? activeTextClass : inactiveTextClass
    }`;
  } else if (config.indicator === "bubble" && active) {
    iconNode = (
      <span className="-mt-4 flex h-9 w-9 items-center justify-center rounded-full bg-navy text-white shadow-soft transition">{link.icon}</span>
    );
  } else if (config.indicator === "circleIcon" && active) {
    iconNode = <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-navy shadow-sm">{link.icon}</span>;
  } else if (config.indicator === "softChip" && active) {
    iconNode = (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy/10 text-navy dark:bg-blue-400/10 dark:text-blue-300">
        {link.icon}
      </span>
    );
  } else if (config.indicator === "scale" && active) {
    iconNode = <span className="inline-block scale-110 text-navy transition-transform dark:text-blue-300">{link.icon}</span>;
  }

  const content = (
    <>
      {config.indicator === "topbar" && (
        <span className={`mb-0.5 h-0.5 w-4 rounded-full transition ${active ? "bg-navy dark:bg-blue-300" : "bg-transparent"}`} />
      )}
      {iconNode}
      {showLabel && <span>{link.label}</span>}
      {config.indicator === "underline" && (
        <span className={`mt-0.5 h-0.5 w-4 rounded-full transition ${active ? "bg-navy dark:bg-blue-300" : "bg-transparent"}`} />
      )}
      {config.indicator === "trackUnderline" && (
        <span className={`relative z-10 mt-0.5 h-[3px] w-6 rounded-full transition ${active ? "bg-navy dark:bg-blue-300" : "bg-transparent"}`} />
      )}
      {config.indicator === "dot" && (
        <span className={`mt-0.5 h-1 w-1 rounded-full transition ${active ? "bg-navy dark:bg-blue-300" : "bg-transparent"}`} />
      )}
    </>
  );

  if (preview) {
    return <div className={wrapperClass}>{content}</div>;
  }
  return (
    <Link href={link.href} className={wrapperClass}>
      {content}
    </Link>
  );
}
