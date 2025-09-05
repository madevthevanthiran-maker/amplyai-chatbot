// components/PresetBar.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Horizontal preset-bar with left/right chevrons.
 * - No "disabled" attribute (only visual dimming) so the cursor is always allowed.
 * - Robust edge computation after layout & on resize/scroll.
 * - Gradients are pointer-events: none so they never block clicks.
 */
export default function PresetBar({
  presets = [],
  onInsert,
  selectedMode,
  className = "",
}) {
  const wrapRef = useRef(null);        // outer wrapper (for gradient bounds)
  const scrollElRef = useRef(null);    // the scrollable strip

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const computeEdges = () => {
    const el = scrollElRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxLeft = scrollWidth - clientWidth;
    // small epsilon for rounding
    const eps = 2;
    setCanScrollLeft(scrollLeft > eps);
    setCanScrollRight(scrollLeft < maxLeft - eps);
  };

  const scrollByAmount = (dir) => {
    const el = scrollElRef.current;
    if (!el) return;
    const amount = Math.max(240, Math.round(el.clientWidth * 0.6));
    const nextLeft = dir === "left" ? el.scrollLeft - amount : el.scrollLeft + amount;
    el.scrollTo({ left: nextLeft, behavior: "smooth" });
    // recheck a moment after the smooth scroll starts
    setTimeout(computeEdges, 200);
  };

  // Initial + whenever presets/mode change
  useLayoutEffect(() => {
    // wait one frame so layout has real sizes
    const raf = requestAnimationFrame(computeEdges);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode, presets?.length]);

  // On resize & scroll
  useEffect(() => {
    const el = scrollElRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(computeEdges);
    });
    ro.observe(el);

    const onScroll = () => computeEdges();
    el.addEventListener("scroll", onScroll, { passive: true });

    // One more compute after mount
    const t = setTimeout(computeEdges, 50);

    return () => {
      clearTimeout(t);
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Keyboard: left/right to scroll the strip
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollByAmount("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollByAmount("right");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // If no presets, render nothing (keeps layout clean)
  if (!presets?.length) return null;

  return (
    <div className={`relative w-full mt-2 select-none ${className}`}>
      {/* Left chevron (always clickable; does nothing if cannot scroll) */}
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => canScrollLeft && scrollByAmount("left")}
        className={[
          "absolute left-0 top-1/2 -translate-y-1/2 z-20",
          "ml-1 h-8 w-8 rounded-full grid place-items-center",
          "bg-slate-800/80 text-slate-100 border border-slate-700",
          "hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-slate-500",
          !canScrollLeft ? "opacity-40 cursor-default" : "opacity-100 cursor-pointer",
        ].join(" ")}
      >
        <ChevronLeft />
      </button>

      {/* Scrollable strip */}
      <div
        ref={wrapRef}
        className="relative px-10" /* leave space for chevrons */
      >
        <div
          ref={scrollElRef}
          className="flex gap-2 overflow-x-auto no-scrollbar py-1"
          style={{ scrollBehavior: "smooth" }}
          onWheel={(e) => {
            // Horizontal wheel support
            if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
            // Let natural wheel scroll; edges will recompute via scroll event
            requestAnimationFrame(computeEdges);
          }}
        >
          {presets.map((p, i) => (
            <button
              key={`${p.label}-${i}`}
              type="button"
              className="preset-btn"
              title={p.text?.slice(0, 160) ?? p.label}
              onClick={() => onInsert?.(p.text ?? "")}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Edge fades (they only visually hint; they never block clicks) */}
        <span className="pointer-events-none absolute inset-y-0 left-8 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
        <span className="pointer-events-none absolute inset-y-0 right-8 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
      </div>

      {/* Right chevron */}
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => canScrollRight && scrollByAmount("right")}
        className={[
          "absolute right-0 top-1/2 -translate-y-1/2 z-20",
          "mr-1 h-8 w-8 rounded-full grid place-items-center",
          "bg-slate-800/80 text-slate-100 border border-slate-700",
          "hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-slate-500",
          !canScrollRight ? "opacity-40 cursor-default" : "opacity-100 cursor-pointer",
        ].join(" ")}
      >
        <ChevronRight />
      </button>
    </div>
  );
}

function ChevronLeft(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
      <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  );
}

function ChevronRight(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
      <path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z" />
    </svg>
  );
}
