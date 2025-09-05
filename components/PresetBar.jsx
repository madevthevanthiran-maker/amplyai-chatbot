// components/PresetBar.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * PresetBar
 * - Renders a horizontally-scrollable row of preset buttons.
 * - Scrollbar is hidden; navigation via chevrons (and touch/trackpad).
 * - Props:
 *    - presets: Array<{label: string, text: string}>
 *    - onInsert: (text: string) => void
 */
export default function PresetBar({ presets = [], onInsert }) {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Recompute chevron enabled/disabled
  const updateChevrons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;

    // Small epsilon to avoid edge jitter
    const EPS = 2;
    setCanLeft(scrollLeft > EPS);
    setCanRight(scrollLeft + clientWidth < scrollWidth - EPS);
  }, []);

  // Scroll by a chunk (75% of visible width)
  const scrollByChunk = useCallback((dir) => {
    const el = trackRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.75) * (dir === "left" ? -1 : 1);
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  // Keep button states synced on scroll / resize
  useEffect(() => {
    updateChevrons();
    const el = trackRef.current;
    if (!el) return;

    const onScroll = () => updateChevrons();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(updateChevrons);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [updateChevrons]);

  if (!presets?.length) return null;

  return (
    <div className="relative mb-3 mt-1">
      {/* Left chevron */}
      <button
        type="button"
        aria-label="Scroll presets left"
        onClick={() => scrollByChunk("left")}
        disabled={!canLeft}
        className={[
          "absolute left-0 top-1/2 -translate-y-1/2 z-10",
          "h-8 w-8 rounded-full grid place-items-center",
          "bg-slate-800/70 border border-slate-700 text-slate-200",
          "hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500",
          !canLeft && "opacity-40 cursor-not-allowed",
        ].join(" ")}
      >
        <ChevronLeft />
      </button>

      {/* The scrolling track (scrollbar hidden via CSS class) */}
      <div
        ref={trackRef}
        className="mx-10 overflow-x-auto no-scrollbar"
        role="toolbar"
        aria-label="Quick presets"
      >
        <div className="flex gap-2 py-1">
          {presets.map((p, idx) => (
            <button
              key={`${p.label}-${idx}`}
              type="button"
              title={p.text.slice(0, 140)}
              onClick={() => onInsert?.(p.text ?? "")}
              className={[
                "preset-btn",              // custom class from globals.css for a consistent look
                "hover:bg-slate-600/70",   // extra hover polish
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right chevron */}
      <button
        type="button"
        aria-label="Scroll presets right"
        onClick={() => scrollByChunk("right")}
        disabled={!canRight}
        className={[
          "absolute right-0 top-1/2 -translate-y-1/2 z-10",
          "h-8 w-8 rounded-full grid place-items-center",
          "bg-slate-800/70 border border-slate-700 text-slate-200",
          "hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500",
          !canRight && "opacity-40 cursor-not-allowed",
        ].join(" ")}
      >
        <ChevronRight />
      </button>

      {/* Optional soft edge fades so users know there's more */}
      <div className="pointer-events-none absolute left-8 top-0 h-full w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
      <div className="pointer-events-none absolute right-8 top-0 h-full w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
    </div>
  );
}

/* Simple inline SVGs so you don't need any icon deps */
function ChevronLeft(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...props}>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevronRight(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...props}>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
