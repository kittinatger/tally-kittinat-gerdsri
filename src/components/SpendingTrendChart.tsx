"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { dotClasses } from "@/lib/category-styles";
import { ChevronIcon } from "@/lib/icons";

export type ChartType = "bar" | "line" | "area" | "pie" | "radar" | "stacked";

export const CHART_TYPE_ORDER: ChartType[] = ["bar", "line", "area", "pie", "radar", "stacked"];
export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: "Bar",
  line: "Line",
  area: "Area",
  pie: "Pie",
  radar: "Radar",
  stacked: "Stacked bar",
};

export type TrendPoint = { key: string; label: string; amount: number };
export type StackedTrendPoint = {
  key: string;
  label: string;
  segments: Array<{ name: string; amount: number; color?: string }>;
};

const VIEW_W = 300;
const VIEW_H = 150;
const PAD = 8;

export function ChartTypeDropdown({ value, onChange }: { value: ChartType; onChange: (type: ChartType) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 rounded-full border border-line bg-bg-soft px-3.5 py-2 text-sm font-medium text-foreground transition hover:border-navy"
      >
        <span className="truncate">{CHART_TYPE_LABELS[value]}</span>
        <ChevronIcon className={`h-3.5 w-3.5 shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-40 overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-1.5 shadow-[var(--panel-shadow)] backdrop-blur-xl"
        >
          {CHART_TYPE_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              role="option"
              aria-selected={value === t}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={`w-full truncate rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                value === t ? "bg-bg-soft text-foreground" : "text-ink-soft hover:bg-bg-soft hover:text-foreground"
              }`}
            >
              {CHART_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function polarPoint(cx: number, cy: number, r: number, index: number, count: number): { x: number; y: number } {
  const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const start = { x: cx + r * Math.cos(toRad(endAngle)), y: cy + r * Math.sin(toRad(endAngle)) };
  const end = { x: cx + r * Math.cos(toRad(startAngle)), y: cy + r * Math.sin(toRad(startAngle)) };
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export default function SpendingTrendChart({
  chartType,
  points,
  stackedPoints,
  currency,
  seriesTextClass,
  seriesBgClass,
}: {
  chartType: ChartType;
  points: TrendPoint[];
  stackedPoints: StackedTrendPoint[];
  currency: string;
  /** Tailwind text-* class(es) used for SVG currentColor strokes/fills (line/area/pie/radar). */
  seriesTextClass: string;
  /** Tailwind bg-* class(es) used for solid fills (bar/legend dots). */
  seriesBgClass: string;
}) {
  if (chartType === "bar") {
    const max = Math.max(...points.map((p) => p.amount), 0);
    return (
      <div className="flex items-end justify-between gap-2">
        {points.map((p) => (
          <div key={p.key} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[11px] font-semibold text-foreground">
              {p.amount > 0 ? formatCurrency(p.amount, currency) : ""}
            </span>
            <div className="flex h-24 w-full items-end">
              <div
                className={`w-full rounded-t-md transition-all ${seriesBgClass}`}
                style={{ height: `${max > 0 ? Math.max((p.amount / max) * 100, p.amount > 0 ? 4 : 0) : 0}%` }}
              />
            </div>
            <span className="text-xs text-ink-soft">{p.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (chartType === "stacked") {
    const totals = stackedPoints.map((p) => p.segments.reduce((sum, s) => sum + s.amount, 0));
    const max = Math.max(...totals, 0);
    const allCategories = Array.from(
      new Map(
        stackedPoints.flatMap((p) => p.segments).map((s) => [s.name, s.color] as const),
      ).entries(),
    );
    return (
      <div>
        <div className="flex items-end justify-between gap-2">
          {stackedPoints.map((p, i) => (
            <div key={p.key} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[11px] font-semibold text-foreground">
                {totals[i] > 0 ? formatCurrency(totals[i], currency) : ""}
              </span>
              <div className="flex h-24 w-full flex-col-reverse gap-px overflow-hidden rounded-t-md">
                {p.segments.map((s) => (
                  <div
                    key={s.name}
                    className={dotClasses(s.color)}
                    style={{ height: max > 0 ? `${(s.amount / max) * 100}%` : 0 }}
                    title={`${s.name}: ${formatCurrency(s.amount, currency)}`}
                  />
                ))}
              </div>
              <span className="text-xs text-ink-soft">{p.label}</span>
            </div>
          ))}
        </div>
        {allCategories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-line pt-3">
            {allCategories.map(([name, color]) => (
              <span key={name} className="flex items-center gap-1.5 text-xs text-ink-soft">
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses(color)}`} />
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (chartType === "line" || chartType === "area") {
    const max = Math.max(...points.map((p) => p.amount), 0);
    const step = points.length > 1 ? (VIEW_W - PAD * 2) / (points.length - 1) : 0;
    const coords = points.map((p, i) => ({
      x: PAD + i * step,
      y: max > 0 ? VIEW_H - PAD - ((p.amount / max) * (VIEW_H - PAD * 2)) : VIEW_H - PAD,
      point: p,
    }));
    const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
    const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? PAD} ${VIEW_H - PAD} L ${PAD} ${VIEW_H - PAD} Z`;
    return (
      <div>
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={`h-32 w-full ${seriesTextClass}`}>
          {chartType === "area" && <path d={areaPath} fill="currentColor" opacity={0.15} stroke="none" />}
          <path d={linePath} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {coords.map((c) => (
            <circle key={c.point.key} cx={c.x} cy={c.y} r={3} fill="currentColor" />
          ))}
        </svg>
        <div className="mt-1.5 flex justify-between">
          {points.map((p) => (
            <span key={p.key} className="flex-1 text-center text-xs text-ink-soft">
              {p.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (chartType === "pie") {
    const total = points.reduce((sum, p) => sum + p.amount, 0);
    const pieSize = VIEW_H;
    const cx = pieSize / 2;
    const cy = pieSize / 2;
    const r = pieSize / 2 - PAD;
    const slices = points
      .filter((p) => p.amount > 0)
      .reduce<Array<{ point: TrendPoint; start: number; end: number }>>((acc, p) => {
        const cursor = acc.length > 0 ? acc[acc.length - 1].end : 0;
        const sweep = total > 0 ? (p.amount / total) * 360 : 0;
        acc.push({ point: p, start: cursor, end: cursor + sweep });
        return acc;
      }, []);
    return (
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <svg viewBox={`0 0 ${pieSize} ${pieSize}`} className="h-32 w-32 shrink-0">
          {slices.map((s, i) => (
            <path
              key={s.point.key}
              d={arcPath(cx, cy, r, s.start, s.end)}
              className={i % 2 === 0 ? seriesTextClass : `${seriesTextClass} opacity-60`}
              fill="currentColor"
              stroke="var(--surface)"
              strokeWidth={1.5}
            />
          ))}
        </svg>
        <div className="flex flex-col gap-1.5">
          {points
            .filter((p) => p.amount > 0)
            .map((p, i) => (
              <span key={p.key} className="flex items-center gap-1.5 text-xs text-ink-soft">
                <span className={`h-2 w-2 shrink-0 rounded-full ${seriesBgClass} ${i % 2 === 0 ? "" : "opacity-60"}`} />
                {p.label} — {formatCurrency(p.amount, currency)}
              </span>
            ))}
        </div>
      </div>
    );
  }

  // radar
  const max = Math.max(...points.map((p) => p.amount), 0);
  const cx = VIEW_W / 2;
  const cy = VIEW_H / 2;
  const r = VIEW_H / 2 - PAD * 2;
  const count = points.length;
  const ringLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = points.map((p, i) => {
    const radius = max > 0 ? (p.amount / max) * r : 0;
    const pt = polarPoint(cx, cy, radius, i, count);
    return { ...pt, point: p };
  });
  const polygonPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={`h-40 w-full ${seriesTextClass}`}>
        {ringLevels.map((lvl) => (
          <polygon
            key={lvl}
            points={Array.from({ length: count })
              .map((_, i) => polarPoint(cx, cy, r * lvl, i, count))
              .map((p) => `${p.x},${p.y}`)
              .join(" ")}
            fill="none"
            stroke="var(--line)"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: count }).map((_, i) => {
          const edge = polarPoint(cx, cy, r, i, count);
          return <line key={i} x1={cx} y1={cy} x2={edge.x} y2={edge.y} stroke="var(--line)" strokeWidth={1} />;
        })}
        <path d={polygonPath} fill="currentColor" opacity={0.2} stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
        {dataPoints.map((p) => (
          <circle key={p.point.key} cx={p.x} cy={p.y} r={3} fill="currentColor" />
        ))}
      </svg>
      <div className="mt-1.5 flex justify-between">
        {points.map((p) => (
          <span key={p.key} className="flex-1 text-center text-xs text-ink-soft">
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
