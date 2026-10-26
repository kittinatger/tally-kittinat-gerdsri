import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { cardForegroundFor } from "@/lib/card-backgrounds";
import type { CardFolder } from "@/types/card-folder";

// Peeking mini cards, back to front: how far each sits above the pocket and
// how it fans out on hover (inspired by a "wallet with cards" design).
const PEEK = [
  { bottom: "36%", hover: "group-hover:-translate-y-[16%] group-hover:-rotate-3", z: "z-[1]" },
  { bottom: "30%", hover: "group-hover:-translate-y-[10%] group-hover:rotate-2", z: "z-[2]" },
  { bottom: "24%", hover: "group-hover:-translate-y-[4%]", z: "z-[3]" },
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
      className={`group relative w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-soft ${
        isPassFolder ? "aspect-[5/7] min-h-[260px]" : "aspect-[1.586/1] min-h-[190px]"
      }`}
    >
      {/* Wallet back: the dark inside, with the folder's name on its top edge. */}
      <div className="absolute inset-0 shadow-[inset_0_18px_30px_rgba(0,0,0,0.45)]" />
      <div className="absolute inset-x-4 top-3 z-[5] flex items-center justify-between gap-2 text-white">
        <p className="min-w-0 truncate text-sm font-semibold">{folder.name}</p>
        {/* Pass folders already show their count as the summary. */}
        {summaryLabel && (
          <p className="shrink-0 text-[11px] font-medium text-white/60">
            {previewColors.length} {previewColors.length === 1 ? "card" : "cards"}
          </p>
        )}
      </div>

      {/* Mini cards peeking out of the pocket. */}
      {cards.map((c, i) => (
        <div
          key={i}
          className={`absolute inset-x-[6%] h-[40%] rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_-4px_12px_rgba(0,0,0,0.25)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${peeks[i].z} ${peeks[i].hover} ${heroGradientClasses(c)}`}
          style={{ bottom: peeks[i].bottom, ...colorHeroStyle(c) }}
        >
          <span className="absolute left-[7%] top-[22%] h-[22%] w-[13%] rounded-[4px] border border-white/15 bg-white/25" />
        </div>
      ))}

      {/* Pocket front in the folder's colour, with the summary. */}
      <div
        className={`absolute inset-x-0 bottom-0 z-[4] flex h-[52%] flex-col justify-end rounded-b-2xl rounded-t-[28px] px-4 pb-3.5 shadow-[0_-10px_24px_rgba(0,0,0,0.35)] ${heroGradientClasses(folder.color)}`}
        style={{ color: fg.full, ...colorHeroStyle(folder.color) }}
      >
        {summaryLabel && (
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: fg.a85 }}>
            {summaryLabel}
          </p>
        )}
        <p className="truncate text-2xl font-bold">{summaryValue}</p>
      </div>
    </div>
  );
}
