"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { ArrowArcLeftIcon, ArrowArcRightIcon, BroomIcon } from "@phosphor-icons/react/dist/ssr";
import { SIGNATURE_VIEWBOX } from "@/lib/signature";

type Point = { x: number; y: number };

type History = { strokes: string[]; undone: string[] };
type Action = { type: "add"; stroke: string } | { type: "undo" } | { type: "redo" } | { type: "clear" };

// Strokes drawn so far plus what was undone (for redo); a new stroke drops
// the redo stack.
function history(state: History, action: Action): History {
  switch (action.type) {
    case "add":
      return { strokes: [...state.strokes, action.stroke], undone: [] };
    case "undo":
      return state.strokes.length
        ? { strokes: state.strokes.slice(0, -1), undone: [...state.undone, state.strokes[state.strokes.length - 1]] }
        : state;
    case "redo":
      return state.undone.length
        ? { strokes: [...state.strokes, state.undone[state.undone.length - 1]], undone: state.undone.slice(0, -1) }
        : state;
    case "clear":
      return { strokes: [], undone: [] };
  }
}

// One stroke as smooth SVG path data: quadratic curves through the midpoints.
function strokePath(points: Point[]): string {
  if (points.length === 0) return "";
  const f = (n: number) => n.toFixed(1);
  if (points.length < 3) return points.map((p, i) => `${i ? "L" : "M"}${f(p.x)} ${f(p.y)}`).join(" ");
  let d = `M${f(points[0].x)} ${f(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const mid = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 };
    d += ` Q${f(points[i].x)} ${f(points[i].y)} ${f(mid.x)} ${f(mid.y)}`;
  }
  const last = points[points.length - 1];
  return `${d} L${f(last.x)} ${f(last.y)}`;
}

// The box around the ink (with a little room), so a signature fills
// whatever space it's shown in instead of shrinking with the drawing pad's
// empty margins.
function inkBox(path: string): string {
  const nums = path.match(/-?d+(.d+)?/g)?.map(Number) ?? [];
  if (nums.length < 2) return `0 0 ${SIGNATURE_VIEWBOX.width} ${SIGNATURE_VIEWBOX.height}`;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    minX = Math.min(minX, nums[i]);
    maxX = Math.max(maxX, nums[i]);
    minY = Math.min(minY, nums[i + 1]);
    maxY = Math.max(maxY, nums[i + 1]);
  }
  const pad = 8;
  return `${minX - pad} ${minY - pad} ${Math.max(1, maxX - minX) + pad * 2} ${Math.max(1, maxY - minY) + pad * 2}`;
}

/** Shows a saved signature (SVG path data), cropped to the ink, at any size. */
export function SignatureSvg({ path, className = "" }: { path: string; className?: string }) {
  return (
    <svg viewBox={inkBox(path)} className={className} aria-label="Signature" role="img" preserveAspectRatio="xMidYMid meet">
      {/* Constant on-screen thickness however small it's drawn. */}
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.6} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Draw a signature with a finger, pen or mouse: undo/redo (also Ctrl+Z /
// Ctrl+Shift+Z or Ctrl+Y), Clear, a guide line and a placeholder. Reports the
// whole drawing as SVG path data (null when empty) on every change.
export default function SignaturePad({ onChange }: { onChange: (path: string | null) => void }) {
  const [{ strokes, undone }, dispatch] = useReducer(history, { strokes: [], undone: [] });
  const [live, setLive] = useState<Point[] | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current(strokes.length ? strokes.join(" ") : null);
  }, [strokes]);

  function toPoint(e: React.PointerEvent): Point {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * SIGNATURE_VIEWBOX.width,
      y: ((e.clientY - r.top) / r.height) * SIGNATURE_VIEWBOX.height,
    };
  }

  const undo = () => dispatch({ type: "undo" });
  const redo = () => dispatch({ type: "redo" });
  const clear = () => dispatch({ type: "clear" });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "undo" });
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        dispatch({ type: "redo" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const empty = strokes.length === 0 && !live;
  const toolButton =
    "flex h-8 items-center gap-1.5 px-2.5 text-xs font-semibold text-surface-foreground transition hover:bg-[var(--surface-nav-hover)] disabled:opacity-40";

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <div role="group" aria-label="History" className="flex overflow-hidden rounded-lg border border-surface-line">
          <button type="button" onClick={undo} disabled={!strokes.length} aria-label="Undo" className={toolButton}>
            <ArrowArcLeftIcon weight="fill" aria-hidden="true" className="h-4 w-4" />
          </button>
          <button type="button" onClick={redo} disabled={!undone.length} aria-label="Redo" className={`${toolButton} border-l border-surface-line`}>
            <ArrowArcRightIcon weight="fill" aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <p className="hidden items-center gap-1 text-xs text-surface-foreground-soft sm:flex">
          <kbd className="rounded border border-surface-line bg-surface-soft px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd>
          <kbd className="rounded border border-surface-line bg-surface-soft px-1.5 py-0.5 font-mono text-[10px]">Z</kbd>
          to undo
        </p>
        <button type="button" onClick={clear} disabled={empty} className={`${toolButton} ml-auto rounded-lg border border-surface-line`}>
          <BroomIcon weight="fill" aria-hidden="true" className="h-4 w-4" />
          Clear
        </button>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-surface-line bg-white text-neutral-900">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIGNATURE_VIEWBOX.width} ${SIGNATURE_VIEWBOX.height}`}
          className="block h-40 w-full touch-none select-none sm:h-48"
          preserveAspectRatio="none"
          onPointerDown={(e) => {
            e.preventDefault();
            (e.currentTarget as Element).setPointerCapture(e.pointerId);
            setLive([toPoint(e)]);
          }}
          onPointerMove={(e) => {
            if (!live) return;
            setLive((prev) => (prev ? [...prev, toPoint(e)] : prev));
          }}
          onPointerUp={() => {
            if (live && live.length) {
              dispatch({ type: "add", stroke: strokePath(live.length === 1 ? [live[0], { x: live[0].x + 0.5, y: live[0].y }] : live) });
            }
            setLive(null);
          }}
          onPointerCancel={() => setLive(null)}
        >
          {/* Guide line to sign on */}
          <line x1="40" x2={SIGNATURE_VIEWBOX.width - 40} y1="112" y2="112" stroke="#d4d4d4" strokeWidth="2" strokeDasharray="6 6" />
          <text x="40" y="104" fill="#a3a3a3" fontSize="22">×</text>
          {strokes.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {live && <path d={strokePath(live)} fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
        {empty && (
          <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-neutral-400">Draw your signature</p>
        )}
      </div>
    </div>
  );
}
