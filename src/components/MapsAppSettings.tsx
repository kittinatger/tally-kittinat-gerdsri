"use client";

import { AppleLogoIcon, DeviceMobileIcon, GoogleLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { useT } from "@/lib/language-context";
import { setMapsAppPreference, useMapsAppPreference, type MapsAppPreference } from "@/lib/maps-app";

export default function MapsAppSettings() {
  const t = useT();
  const pref = useMapsAppPreference();

  const options: { value: MapsAppPreference; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      value: "auto",
      label: t("maps.auto"),
      desc: t("maps.autoDesc"),
      icon: <DeviceMobileIcon weight="fill" aria-hidden="true" className="h-5 w-5" />,
    },
    {
      value: "apple",
      label: t("maps.apple"),
      desc: t("maps.appleDesc"),
      icon: <AppleLogoIcon weight="fill" aria-hidden="true" className="h-5 w-5" />,
    },
    {
      value: "google",
      label: t("maps.google"),
      desc: t("maps.googleDesc"),
      icon: <GoogleLogoIcon weight="fill" aria-hidden="true" className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">{t("maps.intro")}</p>
      <div role="radiogroup" aria-label={t("settings.mapsApp")} className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {options.map((opt) => {
          const active = pref === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMapsAppPreference(opt.value)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--surface-nav-hover)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-soft text-ink-soft">{opt.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                <span className="block text-xs text-ink-soft">{opt.desc}</span>
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
        })}
      </div>
    </div>
  );
}
