import { heroGradientClasses, colorHeroStyle, dotClasses, colorDotStyle } from "@/lib/category-styles";
import { cardForegroundFor } from "@/lib/card-backgrounds";
import type { CardFolder } from "@/types/card-folder";

// A folder tile for the /wallet page's card/pass stacks — same
// aspect-[1.586/1] shell as AccountCardShape/WalletCardShape/PassShape so
// it fits uniformly into CardStack/CardGrid alongside them, and the same
// name-at-top layout those three use: CardStack's "peeking" state only
// shows a card's top ~64px, so the folder's name (the one thing that
// actually identifies it) has to live there too, not at the bottom.
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
  return (
    <div
      className={`flex aspect-[1.586/1] min-h-[190px] w-full flex-col justify-between rounded-2xl p-4 shadow-soft ${heroGradientClasses(folder.color)}`}
      style={{ color: fg.full, ...colorHeroStyle(folder.color) }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold">{folder.name}</p>
        {summaryLabel && (
          <p className="shrink-0 text-xs font-bold uppercase tracking-wide" style={{ color: fg.a85 }}>
            {summaryLabel}
          </p>
        )}
      </div>
      {previewColors.length > 0 && (
        <div className="flex items-center gap-1.5">
          {previewColors.slice(0, 4).map((c, i) => (
            <span key={i} className={`h-2 flex-1 rounded-full opacity-90 ${dotClasses(c)}`} style={colorDotStyle(c)} />
          ))}
        </div>
      )}
      <p className="truncate text-2xl font-bold">{summaryValue}</p>
    </div>
  );
}
