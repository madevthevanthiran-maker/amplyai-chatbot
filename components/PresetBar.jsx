// components/PresetBar.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * PresetBar
 * - Horizontal row of preset buttons
 * - Scrollbar hidden; navigation via chevrons or touchpad/drag
 * - Arrow keys work when the bar is focused
 */
export default function PresetBar({ presets = [], onInsert }) {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateChevrons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const EPS = 2;
    setCanLeft(scrollLeft > EPS);
    setCanRight(scrollLeft + clientWidth < scrollWidth - EPS);
  }, []);

  const scrollByChunk = useCallback((dir) => {
    const el = trackRef.current;
    if (!el) return;
    // Guard: if we can't scroll that direction, bail
    if (dir === "left" && !canLeft) return;
    if (dir === "right" && !canRight) return;

    const delta =
      Math.round(el.clientWidth * 0.75) * (dir === "left" ? -1 : 1);
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, [canLeft, canRight]);

  useEffect(() => {
    // Give layout a tick so measurements are correct
    const id = requestAnimationFrame(updateChevrons);

    const el = trackRef.current;
    if (!el) return () => cancelAnimationFrame(id);

    const onScroll = () => updateChevrons();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(updateChevrons);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(id);
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [updateChevrons]);

  // Arrow keys to scroll when the bar is focused
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByChunk("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByChunk("right");
    }
  };

  if (!presets?.length) return null;

  return (
    <div className="relative mb-3 mt-1">
      {/* Left chevron */}
      <button
        type="button"
        aria-label="Scroll presets left"
        onClick={() => scrollByChunk("left")}
        // not using disabled prop; we only style the state
        className={[
          "absolute left-0 top-1/2 -translate-y-1/2",
          "z-30 pointer-events-auto", // make sure it sits on top & clickable
          "h-8 w-8 rounded-full grid place-items-center",
          "bg-slate-800/70 border border-slate-700 text-slate-200",
          "hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500",
          !canLeft && "opacity-40 cursor-not-allowed",
        ].join(" ")}
      >
        <ChevronLeft />
      </button>

      {/* Scrollable track */}
      <div
        ref={trackRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="mx-10 overflow-x-auto no-scrollbar focus:outline-none"
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
                "preset-btn",
                "hover:bg-slate-600/70",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
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
        className={[
          "absolute right-0 top-1/2 -translate-y-1/2",
          "z-30 pointer-events-auto",
          "h-8 w-8 rounded-full grid place-items-center",
          "bg-slate-800/70 border border-slate-700 text-slate-200",
          "hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500",
          !canRight && "opacity-40 cursor-not-allowed",
        ].join(" ")}
      >
        <ChevronRight />
      </button>

      {/* Fade edges (won't block clicks) */}
      <div className="pointer-events-none absolute left-8 top-0 h-full w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent z-20" />
      <div className="pointer-events-none absolute right-8 top-0 h-full w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent z-20" />
    </div>
  );
}

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
