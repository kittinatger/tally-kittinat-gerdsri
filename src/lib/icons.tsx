// Shared icon set for the whole app, drawn from Phosphor Icons
// (phosphoricons.com, MIT License, Copyright (c) 2020-2024 Phosphor Icons) in
// the "fill" weight — the same set and weight as the author's portfolio site,
// so both read as one visual language. Each export keeps the app's own name
// and className-based sizing (Tailwind h-/w- classes override Phosphor's
// default 1em size), so call sites don't depend on the icon library.
//
// Imported from the /dist/ssr entry: those components don't read React
// context, so they render the same in server and client components.
import {
  AirplaneTiltIcon,
  ArchiveIcon as PhArchive,
  BabyIcon,
  BankIcon,
  BarbellIcon,
  BellIcon as PhBell,
  BookOpenIcon,
  BusIcon,
  CalendarBlankIcon,
  CameraIcon as PhCamera,
  CarIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ChartBarIcon,
  ChartLineUpIcon,
  CheckCircleIcon as PhCheckCircle,
  CheckIcon as PhCheck,
  CoffeeIcon,
  CreditCardIcon,
  DeviceMobileIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  FileIcon as PhFile,
  FilmSlateIcon,
  FlowerLotusIcon,
  GameControllerIcon,
  GearIcon as PhGear,
  GiftIcon,
  GraduationCapIcon,
  HamburgerIcon,
  HeartbeatIcon,
  HouseIcon,
  ImageIcon as PhImage,
  LightbulbIcon,
  ListBulletsIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  MoneyIcon,
  MoonIcon,
  MusicNotesIcon,
  PackageIcon,
  PaintBrushIcon,
  PaletteIcon as PhPalette,
  PawPrintIcon,
  PencilSimpleIcon,
  PillIcon,
  PlusIcon as PhPlus,
  ReceiptIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SparkleIcon as PhSparkle,
  SunIcon,
  TagIcon as PhTag,
  TrashIcon as PhTrash,
  TShirtIcon,
  UploadSimpleIcon,
  WalletIcon,
  WineIcon,
  WrenchIcon,
  XCircleIcon as PhXCircle,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { isCategoryIconKey, type CategoryIconKey } from "./category-icons";

type IconProps = { className?: string };

function fill(Glyph: PhosphorIcon, fallback = "h-4 w-4") {
  function AppIcon({ className }: IconProps) {
    return <Glyph weight="fill" aria-hidden="true" className={className ?? fallback} />;
  }
  return AppIcon;
}

// Phosphor draws the "fill" weight of bare line glyphs (+, ×, ✓) as a solid
// rounded square with the symbol knocked out, which reads as a boxed button
// rather than the symbol itself — those use the bold weight instead.
function bold(Glyph: PhosphorIcon, fallback = "h-4 w-4") {
  function AppIcon({ className }: IconProps) {
    return <Glyph weight="bold" aria-hidden="true" className={className ?? fallback} />;
  }
  return AppIcon;
}

// ---- Common action icons -------------------------------------------------

export const TrashIcon = fill(PhTrash);
export const EditIcon = fill(PencilSimpleIcon);
export const PlusIcon = bold(PhPlus);
export const CloseIcon = bold(XIcon);
export const ChevronIcon = fill(CaretDownIcon);
export const ChevronLeftIcon = fill(CaretLeftIcon);
export const ChevronRightIcon = fill(CaretRightIcon);
export const SearchIcon = fill(MagnifyingGlassIcon);
export const DownloadIcon = fill(DownloadSimpleIcon);
export const UploadIcon = fill(UploadSimpleIcon);
export const HomeIcon = fill(HouseIcon);
export const ListIcon = fill(ListBulletsIcon);
export const AnalyticsIcon = fill(ChartBarIcon);
export const ImageIcon = fill(PhImage);
export const CameraIcon = fill(PhCamera);
export const FileIcon = fill(PhFile);
export const MembershipCardIcon = fill(WalletIcon);
export const ArchiveIcon = fill(PhArchive);
export const CheckCircleIcon = fill(PhCheckCircle);
export const XCircleIcon = fill(PhXCircle);
export const MoreIcon = fill(DotsThreeIcon);
export const GearIcon = fill(PhGear);
export const BellIcon = fill(PhBell);
export const MicIcon = fill(MicrophoneIcon);
export const CalendarIcon = fill(CalendarBlankIcon);
export const PaletteIcon = fill(PhPalette);
export const TagIcon = fill(PhTag);
export const SparkleIcon = fill(PhSparkle);
export const CheckIcon = bold(PhCheck);

// Both glyphs always render and the `dark:` variant (keyed off
// <html data-theme>) picks which one shows — reading the theme into React
// state instead would make the first client render disagree with the server
// HTML and throw a hydration mismatch (see SettingsMenu.tsx).
export function SunMoonIcon({ className }: IconProps) {
  const size = className ?? "h-5 w-5";
  return (
    <>
      <SunIcon weight="fill" aria-hidden="true" className={`${size} dark:hidden`} />
      <MoonIcon weight="fill" aria-hidden="true" className={`hidden ${size} dark:block`} />
    </>
  );
}

// ---- Category icons -------------------------------------------------------
// Each category stores a short key (see CATEGORY_ICON_KEYS); unrecognized or
// legacy values (old emoji saved before keys existed) render nothing and the
// caller falls back to its usual monogram/dot treatment.

export const CATEGORY_ICON_COMPONENTS: Record<CategoryIconKey, React.ComponentType<IconProps>> = {
  cart: fill(ShoppingCartIcon),
  burger: fill(HamburgerIcon),
  coffee: fill(CoffeeIcon),
  car: fill(CarIcon),
  bus: fill(BusIcon),
  plane: fill(AirplaneTiltIcon),
  home: HomeIcon,
  bulb: fill(LightbulbIcon),
  shield: fill(ShieldCheckIcon),
  movie: fill(FilmSlateIcon),
  game: fill(GameControllerIcon),
  book: fill(BookOpenIcon),
  health: fill(HeartbeatIcon),
  pill: fill(PillIcon),
  beauty: fill(FlowerLotusIcon),
  baby: fill(BabyIcon),
  pet: fill(PawPrintIcon),
  gift: fill(GiftIcon),
  gradcap: fill(GraduationCapIcon),
  fitness: fill(BarbellIcon),
  art: fill(PaintBrushIcon),
  music: fill(MusicNotesIcon),
  phone: fill(DeviceMobileIcon),
  receipt: fill(ReceiptIcon),
  tool: fill(WrenchIcon),
  box: fill(PackageIcon),
  shirt: fill(TShirtIcon),
  card: fill(CreditCardIcon),
  cash: fill(MoneyIcon),
  bank: fill(BankIcon),
  chart: fill(ChartLineUpIcon),
  wine: fill(WineIcon),
};

/**
 * Renders a category's icon by key, or nothing if the key is missing or
 * unrecognized (e.g. an emoji saved under the old picker) — callers fall back
 * to their usual monogram/dot treatment in that case.
 */
export function CategoryIcon({ iconKey, className }: { iconKey: string | null | undefined; className?: string }) {
  if (!iconKey || !isCategoryIconKey(iconKey)) return null;
  const Icon = CATEGORY_ICON_COMPONENTS[iconKey];
  return <Icon className={className} />;
}
