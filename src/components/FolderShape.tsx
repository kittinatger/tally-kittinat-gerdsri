import { FolderSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { cardForegroundFor } from "@/lib/card-backgrounds";
import type { CardFolder } from "@/types/card-folder";

// Peeking mini cards, back to front: how far each sits above the pocket, how
// it fans out on hover, and how long it waits to join that fan (inspired by
// a "wallet with cards" design) — staggering both the fan and the entrance
// below reads as the cards coming loose one at a time rather than the whole
// stack snapping at once.
const PEEK = [
  { bottom: "36%", hover: "group-hover:-translate-y-[16%] group-hover:-rotate-3", z: "z-[1]", delay: "0ms" },
  { bottom: "30%", hover: "group-hover:-translate-y-[10%] group-hover:rotate-2", z: "z-[2]", delay: "40ms" },
  { bottom: "24%", hover: "group-hover:-translate-y-[4%]", z: "z-[3]", delay: "80ms" },
];

// A folder tile for the /wallet page's card/pass stacks, drawn as a wallet:
// a dark back, up to three mini cards (in the colours of what's inside)
// peeking out of a pocket in the folder's colour, and the folder's name and
// summary on the pocket. Same aspect-[1.586/1] shell as AccountCardShape/
// WalletCardShape/PassShape so it fits CardStack/CardGrid alongside them;
// the name has the back's top band to itself (cards peek out below it)
// because CardStack's "peeking" state only shows a card's top ~64px.
export default function FolderShape({
  folder,
  previewColors,
  summaryLabel,
  summaryValue,
}: {
  folder: CardFolder;
  previewColors: string[];
  /** Small uppercase label next to the name — e.g. "Balance" for a wallet
   * folder. Omit for a pass folder, which just shows an item count. */
  summaryLabel?: string;
  summaryValue: string;
}) {
  const fg = cardForegroundFor(null, null, folder.color);
  const cards = previewColors.slice(-3);
  const peeks = PEEK.slice(PEEK.length - cards.length);

  // A pass folder sits in the grid/stack next to full-size pass tiles
  // (PassShape's own codeSize="small" box), which are a taller shape than
  // the flat 1.586:1 payment cards — match it here so the two line up,
  // while a wallet folder keeps the card ratio its own contents use.
  const isPassFolder = folder.kind === "pass";

  return (
    <div
      className={`group relative w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-soft transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-12px_rgba(0,0,0,0.4)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        isPassFolder ? "aspect-[5/7] min-h-[260px]" : "aspect-[1.586/1] min-h-[190px]"
      }`}
    >
      {/* Wallet back: a soft top-to-bottom gradient rather than a flat
       * fill, plus the inset shadow that reads as the pocket's inside
       * shade, so the back has some depth of its own before anything
       * peeks out of it. */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-800 to-neutral-950" />
      <div className="absolute inset-0 shadow-[inset_0_18px_30px_rgba(0,0,0,0.45)]" />
      <div className="absolute inset-x-4 top-3 z-[5] flex items-center justify-between gap-2 text-white">
        <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold">
          <FolderSimpleIcon weight="fill" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-white/70" />
          <span className="truncate">{folder.name}</span>
        </p>
        {/* Pass folders already show their count as the summary. */}
        {summaryLabel && (
          <p className="shrink-0 text-[11px] font-medium text-white/60">
            {previewColors.length} {previewColors.length === 1 ? "card" : "cards"}
          </p>
        )}
      </div>

      {/* Mini cards peeking out of the pocket — fade/slide in once on
       * mount (not every re-render: "backwards" plus the delay only
       * matters the first time), then fan out further on hover. */}
      {cards.map((c, i) => (
        <div
          key={i}
          className={`absolute inset-x-[6%] h-[40%] animate-[fade-in-up_0.4s_ease-out_backwards] rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_-4px_12px_rgba(0,0,0,0.25)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:animate-none motion-reduce:transition-none ${peeks[i].z} ${peeks[i].hover} ${heroGradientClasses(c)}`}
          style={{ bottom: peeks[i].bottom, animationDelay: peeks[i].delay, transitionDelay: peeks[i].delay, ...colorHeroStyle(c) }}
        >
          <span className="absolute left-[7%] top-[22%] h-[22%] w-[13%] rounded-[4px] border border-white/15 bg-white/25" />
        </div>
      ))}

      {/* Pocket front in the folder's colour, with the summary. A soft
       * light-to-clear sheen near the fold (where it meets the back)
       * gives it a slight curve instead of reading as flat paint. */}
      <div
        className={`absolute inset-x-0 bottom-0 z-[4] flex h-[52%] flex-col justify-end overflow-hidden rounded-b-2xl rounded-t-[28px] px-4 pb-3.5 shadow-[0_-10px_24px_rgba(0,0,0,0.35)] ${heroGradientClasses(folder.color)}`}
        style={{ color: fg.full, ...colorHeroStyle(folder.color) }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/20 to-transparent" />
        {summaryLabel && (
          <p className="relative text-[11px] font-bold uppercase tracking-wide" style={{ color: fg.a85 }}>
            {summaryLabel}
          </p>
        )}
        <p className="relative truncate text-2xl font-bold">{summaryValue}</p>
      </div>
    </div>
  );
}
