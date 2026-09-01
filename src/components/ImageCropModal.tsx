"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cropImageToFile } from "@/lib/image-crop";
import { CloseIcon, CheckIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";

const MAX_ZOOM = 4;
const MIN_FRAME_HALF = 40; // px — a freeform frame can't be shrunk smaller than this
const OUTPUT_MAX_DIMENSION = 900;

type Point = { x: number; y: number };
type Size = { w: number; h: number };

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function centroid(points: Point[]): Point {
  return { x: points.reduce((s, p) => s + p.x, 0) / points.length, y: points.reduce((s, p) => s + p.y, 0) / points.length };
}

// Portaled full-screen pan/pinch-zoom cropper — used for both the pass
// banner (fixed 16:9 frame) and logo (freeform, resizable frame) uploads.
// The frame always stays centered in the stage; only its size changes for
// the freeform case, which keeps the crop-rect math below simple (no
// frame-position tracking, just frame *size*).
export default function ImageCropModal({
  file,
  aspect,
  onCancel,
  onCropped,
}: {
  file: File;
  /** Fixed width/height ratio (e.g. 16/9 for the banner) — the frame's
   * shape is locked and only the image pans/zooms underneath it. `null`
   * means freeform: the frame itself is resizable via corner handles,
   * and the crop's own shape becomes whatever the user drags it to. */
  aspect: number | null;
  onCancel: () => void;
  onCropped: (file: File) => void;
}) {
  const t = useT();
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<Size | null>(null);
  const [imgNatural, setImgNatural] = useState<Size | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [frameSize, setFrameSize] = useState<Size | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const panRef = useRef<{ pointers: Map<number, Point>; lastCentroid: Point | null; lastDist: number | null } | null>(null);
  const resizingRef = useRef(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    // Deferred so the setState below doesn't run synchronously in the
    // effect body — same pattern used elsewhere in this app to avoid the
    // cascading-render lint rule.
    const timer = setTimeout(() => setImgUrl(url), 0);
    const img = new Image();
    img.onload = () => setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setError(t("membership.cropLoadError"));
    img.src = url;
    return () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    };
  }, [file, t]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setStageSize({ w: rect.width, h: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Frame size: fixed-aspect ones are derived straight from the stage
  // (recomputed whenever the stage resizes); freeform starts at a
  // reasonable default the first time the stage is known, then is only
  // ever changed by the user dragging a corner handle.
  useEffect(() => {
    if (!stageSize) return;
    const timer = setTimeout(() => {
      if (aspect !== null) {
        let w = stageSize.w * 0.9;
        let h = w / aspect;
        if (h > stageSize.h * 0.9) {
          h = stageSize.h * 0.9;
          w = h * aspect;
        }
        setFrameSize({ w, h });
      } else {
        setFrameSize((prev) => prev ?? { w: Math.min(stageSize.w, stageSize.h) * 0.7, h: Math.min(stageSize.w, stageSize.h) * 0.7 });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [stageSize, aspect]);

  const baseScale = useMemo(() => {
    if (!imgNatural || !frameSize) return 1;
    return Math.max(frameSize.w / imgNatural.w, frameSize.h / imgNatural.h);
  }, [imgNatural, frameSize]);

  const effScale = baseScale * zoom;

  const clampOffset = useCallback(
    (next: Point): Point => {
      if (!imgNatural || !frameSize) return next;
      const dispW = imgNatural.w * effScale;
      const dispH = imgNatural.h * effScale;
      const maxX = Math.max(0, (dispW - frameSize.w) / 2);
      const maxY = Math.max(0, (dispH - frameSize.h) / 2);
      return { x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
    },
    [imgNatural, frameSize, effScale],
  );

  // Re-clamp whenever zoom or frame size changes (not just on pointer
  // moves) — otherwise zooming out via the wheel/pinch after panning to an
  // edge could leave the frame showing blank space outside the image.
  useEffect(() => {
    const timer = setTimeout(() => setOffset((prev) => clampOffset(prev)), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-clamp when the bounds themselves change, not on every offset update (that would fight the pan gesture)
  }, [effScale, frameSize]);

  function resetGestureBaseline() {
    const gesture = panRef.current;
    if (!gesture) return;
    const pts = [...gesture.pointers.values()];
    gesture.lastCentroid = pts.length > 0 ? centroid(pts) : null;
    gesture.lastDist = pts.length === 2 ? distance(pts[0], pts[1]) : null;
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (resizingRef.current) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    if (!panRef.current) panRef.current = { pointers: new Map(), lastCentroid: null, lastDist: null };
    panRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    resetGestureBaseline();
  }

  function handlePointerMove(e: React.PointerEvent) {
    const gesture = panRef.current;
    if (!gesture || !gesture.pointers.has(e.pointerId)) return;
    gesture.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...gesture.pointers.values()];
    const c = centroid(pts);
    if (gesture.lastCentroid) {
      setOffset((prev) => clampOffset({ x: prev.x + (c.x - gesture.lastCentroid!.x), y: prev.y + (c.y - gesture.lastCentroid!.y) }));
    }
    if (pts.length === 2) {
      const dist = distance(pts[0], pts[1]);
      if (gesture.lastDist) {
        const ratio = dist / gesture.lastDist;
        setZoom((prev) => clamp(prev * ratio, 1, MAX_ZOOM));
      }
      gesture.lastDist = dist;
    } else {
      gesture.lastDist = null;
    }
    gesture.lastCentroid = c;
  }

  function handlePointerUp(e: React.PointerEvent) {
    const gesture = panRef.current;
    if (!gesture) return;
    gesture.pointers.delete(e.pointerId);
    if (gesture.pointers.size === 0) {
      panRef.current = null;
    } else {
      resetGestureBaseline();
    }
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((prev) => clamp(prev * (1 - e.deltaY * 0.0015), 1, MAX_ZOOM));
  }

  // The freeform frame is always centered in the stage, so resizing it
  // never needs to track a drag delta — the handle's current position
  // relative to the stage center directly gives the new half-width/height.
  function handleResizePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    resizingRef.current = true;
  }

  function handleResizePointerMove(e: React.PointerEvent) {
    if (!resizingRef.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const halfW = clamp(Math.abs(e.clientX - cx), MIN_FRAME_HALF, rect.width / 2);
    const halfH = clamp(Math.abs(e.clientY - cy), MIN_FRAME_HALF, rect.height / 2);
    setFrameSize({ w: halfW * 2, h: halfH * 2 });
  }

  function handleResizePointerUp(e: React.PointerEvent) {
    resizingRef.current = false;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      // Already released — fine.
    }
  }

  async function handleConfirm() {
    if (!imgNatural || !frameSize) return;
    setProcessing(true);
    setError(null);
    try {
      const dispW = imgNatural.w * effScale;
      const dispH = imgNatural.h * effScale;
      const imgLeft = -dispW / 2 + offset.x;
      const imgTop = -dispH / 2 + offset.y;
      const frameLeft = -frameSize.w / 2;
      const frameTop = -frameSize.h / 2;
      const cropX = clamp((frameLeft - imgLeft) / effScale, 0, imgNatural.w);
      const cropY = clamp((frameTop - imgTop) / effScale, 0, imgNatural.h);
      const cropW = clamp(frameSize.w / effScale, 1, imgNatural.w - cropX);
      const cropH = clamp(frameSize.h / effScale, 1, imgNatural.h - cropY);

      const frameAspect = frameSize.w / frameSize.h;
      const outputWidth = frameAspect >= 1 ? OUTPUT_MAX_DIMENSION : OUTPUT_MAX_DIMENSION * frameAspect;
      const outputHeight = frameAspect >= 1 ? OUTPUT_MAX_DIMENSION / frameAspect : OUTPUT_MAX_DIMENSION;

      const cropped = await cropImageToFile(file, { x: cropX, y: cropY, width: cropW, height: cropH }, outputWidth, outputHeight);
      onCropped(cropped);
    } catch {
      setError(t("membership.cropSaveError"));
    } finally {
      setProcessing(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          aria-label={t("common.cancel")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <CloseIcon />
        </button>
        <p className="text-sm font-semibold text-white">{t("membership.cropTitle")}</p>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!imgNatural || processing}
          aria-label={t("common.done")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90 disabled:opacity-50"
        >
          <CheckIcon className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={stageRef}
        className="relative mx-4 mb-4 flex-1 touch-none overflow-hidden rounded-2xl bg-black/40"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        {imgUrl && imgNatural && frameSize && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- interactively transformed via CSS, not a build-time asset */}
            <img
              src={imgUrl}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                width: imgNatural.w * effScale,
                height: imgNatural.h * effScale,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
            {/* box-shadow with a huge spread dims everything outside the
             * frame in one element, instead of four separate mask panels. */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 border-2 border-white"
              style={{
                width: frameSize.w,
                height: frameSize.h,
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
              }}
            />
            {aspect === null && (
              <div
                className="absolute left-1/2 top-1/2"
                style={{ width: frameSize.w, height: frameSize.h, transform: "translate(-50%, -50%)" }}
              >
                {[
                  { corner: "nw", cls: "-left-2.5 -top-2.5" },
                  { corner: "ne", cls: "-right-2.5 -top-2.5" },
                  { corner: "sw", cls: "-left-2.5 -bottom-2.5" },
                  { corner: "se", cls: "-right-2.5 -bottom-2.5" },
                ].map(({ corner, cls }) => (
                  <div
                    key={corner}
                    onPointerDown={handleResizePointerDown}
                    onPointerMove={handleResizePointerMove}
                    onPointerUp={handleResizePointerUp}
                    onPointerCancel={handleResizePointerUp}
                    className={`absolute h-5 w-5 touch-none rounded-full border-2 border-black bg-white shadow ${cls}`}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!imgNatural && !error && (
          <p className="flex h-full items-center justify-center text-sm text-white/70">{t("common.loading")}</p>
        )}
      </div>

      {error && <p className="px-4 pb-3 text-center text-sm text-red-400">{error}</p>}
      <p className="px-4 pb-4 text-center text-xs text-white/50">
        {aspect === null ? t("membership.cropHintFreeform") : t("membership.cropHintFixed")}
      </p>
    </div>,
    document.body,
  );
}
