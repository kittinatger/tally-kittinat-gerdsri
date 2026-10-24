"use client";

import { useState } from "react";
import {
  AppleLogoIcon,
  CaretDownIcon,
  CompassIcon,
  DeviceMobileIcon,
  GlobeHemisphereWestIcon,
  GoogleLogoIcon,
  LeafIcon,
  MapPinAreaIcon,
  MapPinIcon,
  MapPinLineIcon,
  MapTrifoldIcon,
  NavigationArrowIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { useT } from "@/lib/language-context";
import {
  MAPS_PROVIDERS,
  MAPS_PROVIDER_NAMES,
  setMapsAppPreference,
  useMapsAppPreference,
  type MapsAppPreference,
  type MapsProvider,
} from "@/lib/maps-app";

const PRIMARY: MapsProvider[] = ["apple", "google"];

const ICONS: Record<MapsProvider, PhosphorIcon> = {
  apple: AppleLogoIcon,
  google: GoogleLogoIcon,
  waze: NavigationArrowIcon,
  baidu: MapPinIcon,
  amap: MapPinAreaIcon,
  yandex: MapTrifoldIcon,
  here: CompassIcon,
  mapsme: MapPinLineIcon,
  organic: LeafIcon,
  osm: GlobeHemisphereWestIcon,
};

export default function MapsAppSettings() {
  const t = useT();
  const pref = useMapsAppPreference();

  const providerName = (p: MapsProvider) =>
    p === "apple" ? t("maps.apple") : p === "google" ? t("maps.google") : MAPS_PROVIDER_NAMES[p];

  type Option = { value: MapsAppPreference; label: string; desc: string; Icon: PhosphorIcon };
  const providerOption = (p: MapsProvider): Option => ({
    value: p,
    label: providerName(p),
    desc: t("maps.alwaysOpenIn").replace("{app}", providerName(p)),
    Icon: ICONS[p],
  });
  const mainOptions: Option[] = [
    { value: "auto", label: t("maps.auto"), desc: t("maps.autoDesc"), Icon: DeviceMobileIcon },
    ...PRIMARY.map(providerOption),
  ];
  const otherOptions = MAPS_PROVIDERS.filter((p) => !PRIMARY.includes(p)).map(providerOption);
  // Start expanded when the saved choice is one of the tucked-away providers,
  // so the selected option is never hidden.
  const [showOthers, setShowOthers] = useState(() => otherOptions.some((o) => o.value === pref));

  function renderOption({ value, label, desc, Icon }: Option) {
    const active = pref === value;
    return (
      <button
        key={value}
        type="button"
        role="radio"
        aria-checked={active}
        onClick={() => setMapsAppPreference(value)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--surface-nav-hover)]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-soft text-ink-soft">
          <Icon weight="fill" aria-hidden="true" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">{label}</span>
          <span className="block text-xs text-ink-soft">{desc}</span>
        </span>
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            active ? "border-navy bg-navy" : "border-line"
          }`}
        >
          {active && <span className="h-2 w-2 rounded-full bg-surface" />}
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">{t("maps.intro")}</p>
      <div role="radiogroup" aria-label={t("settings.mapsApp")} className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {mainOptions.map(renderOption)}
        <button
          type="button"
          onClick={() => setShowOthers((v) => !v)}
          aria-expanded={showOthers}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-ink-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-foreground"
        >
          {t("maps.otherProviders")}
          <CaretDownIcon weight="fill" aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 transition-transform ${showOthers ? "rotate-180" : ""}`} />
        </button>
        {showOthers && otherOptions.map(renderOption)}
      </div>
      <p className="text-xs text-ink-soft">{t("maps.fallbackNote")}</p>
    </div>
  );
}
