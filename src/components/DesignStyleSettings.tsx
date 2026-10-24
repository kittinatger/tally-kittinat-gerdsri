"use client";

import { useState } from "react";
import { useT } from "@/lib/language-context";

type Design = "modern" | "classic";

function readDesign(): Design {
  return document.documentElement.getAttribute("data-design") === "classic" ? "classic" : "modern";
}

function applyDesign(design: Design) {
  document.documentElement.setAttribute("data-design", design);
  try {
    if (design === "classic") localStorage.setItem("tally-design", "classic");
    else localStorage.removeItem("tally-design");
  } catch {
    // Storage unavailable — the choice still applies for this session.
  }
}

function Preview({ design }: { design: Design }) {
  const classic = design === "classic";
  return (
    <div
      aria-hidden
      className="flex h-24 flex-col gap-1.5 p-3"
      style={{
        background: classic ? "linear-gradient(160deg,#e3efe6,#f6faf7)" : "#fafafa",
        borderRadius: classic ? 14 : 8,
      }}
    >
      <div
        className="flex items-center justify-between px-2.5 py-2"
        style={{
          background: classic ? "rgba(255,255,255,0.7)" : "#fff",
          borderRadius: classic ? 12 : 6,
          border: classic ? "1px solid rgba(255,255,255,0.9)" : "1px solid #e4e4e7",
          boxShadow: classic ? "0 8px 20px -10px rgba(15,67,49,0.35)" : "none",
        }}
      >
        <span
          style={{
            fontFamily: classic ? "var(--font-radley)" : "var(--font-inter)",
            fontWeight: classic ? 400 : 600,
            fontSize: 13,
            color: classic ? "#1a2b20" : "#18181b",
          }}
        >
          ฿24,310
        </span>
        <span className="h-2 w-8 rounded-full" style={{ background: classic ? "#1f7a5c" : "#157a4f" }} />
      </div>
      <div className="h-2 w-3/4 rounded-full" style={{ background: classic ? "rgba(31,122,92,0.18)" : "#e4e4e7" }} />
      <div className="h-2 w-1/2 rounded-full" style={{ background: classic ? "rgba(31,122,92,0.12)" : "#f4f4f5" }} />
    </div>
  );
}

export default function DesignStyleSettings() {
  const t = useT();
  const [design, setDesign] = useState<Design>(readDesign);

  function choose(next: Design) {
    applyDesign(next);
    setDesign(next);
  }

  const options: { value: Design; label: string; desc: string }[] = [
    { value: "modern", label: t("design.modern"), desc: t("design.modernDesc") },
    { value: "classic", label: t("design.classic"), desc: t("design.classicDesc") },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">{t("design.intro")}</p>
      <div role="radiogroup" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const active = design === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(opt.value)}
              className={`flex flex-col gap-3 rounded-card border bg-surface p-3 text-left transition ${
                active ? "border-navy ring-2 ring-navy/25" : "border-line hover:border-ink-soft/40"
              }`}
            >
              <Preview design={opt.value} />
              <div className="flex items-start justify-between gap-2 px-1">
                <div>
                  <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                  <div className="mt-0.5 text-xs text-ink-soft">{opt.desc}</div>
                </div>
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    active ? "border-navy bg-navy" : "border-line"
                  }`}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-surface" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
