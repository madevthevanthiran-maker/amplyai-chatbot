// components/PresetBar.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Horizontal preset bar with:
 *  - slim visible scrollbar (styled via CSS)
 *  - chevrons (left/right)
 *  - mouse wheel to scroll horizontally
 *  - click-and-drag to scroll
 *  - keyboard arrow keys
 */
export default function PresetBar({
  presets = [],
  onInsert,
  selectedMode,
  className = "",
}) {
  const stripRef = useRef(null);

  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const computeEdges = () => {
    const el = stripRef.current;
    if (!el) return;
    const eps = 2;
    setCanLeft(el.scrollLeft > eps);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - eps);
  };

  const scrollByAmount = (dir) => {
    const el = stripRef.current;
    if (!el) return;
    const amount = Math.max(240, Math.round(el.clientWidth * 0.6));
    el.scrollTo({
      left: dir === "left" ? el.scrollLeft - amount : el.scrollLeft + amount,
      behavior: "smooth",
    });
    setTimeout(computeEdges, 220);
  };

  // Drag-to-scroll
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let startLeft = 0;

    const onDown = (e) => {
      isDown = true;
      startX = e.pageX;
      startLeft = el.scrollLeft;
      el.classList.add("dragging");
    };
    const onMove = (e) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      el.scrollLeft = startLeft - dx;
      computeEdges();
    };
    const onUp = () => {
      isDown = false;
      el.classList.remove("dragging");
    };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Wheel: map vertical wheel to horizontal scroll
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        computeEdges();
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Recompute edges on mount, on resize, on scroll, and when mode/presets change
  useLayoutEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => requestAnimationFrame(computeEdges));
    ro.observe(el);

    const onScroll = () => computeEdges();
    el.addEventListener("scroll", onScroll, { passive: true });

    const raf = requestAnimationFrame(computeEdges);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [selectedMode, presets?.length]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") {
        scrollByAmount("left");
      } else if (e.key === "ArrowRight") {
        scrollByAmount("right");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!presets?.length) return null;

  return (
    <div className={`relative w-full mt-2 ${className}`}>
      {/* Left chevron (always clickable; if no room, it just won't move) */}
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollByAmount("left")}
        className={[
          "absolute left-0 top-1/2 -translate-y-1/2 z-20",
          "ml-1 h-8 w-8 rounded-full grid place-items-center",
          "bg-slate-800/80 text-slate-100 border border-slate-700",
          "hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-slate-500",
          canLeft ? "opacity-100 cursor-pointer" : "opacity-40 cursor-default",
        ].join(" ")}
      >
        <ChevronLeft />
      </button>

      {/* Scrollable strip (shows a slim scrollbar) */}
      <div className="px-10">
        <div
          ref={stripRef}
          className="preset-strip flex gap-2 overflow-x-auto overscroll-x-contain py-1 scroll-smooth"
          tabIndex={0}
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

        {/* Edge fades (visual only, never block clicks) */}
        <span className="pointer-events-none absolute inset-y-0 left-8 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
        <span className="pointer-events-none absolute inset-y-0 right-8 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
      </div>

      {/* Right chevron */}
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollByAmount("right")}
        className={[
          "absolute right-0 top-1/2 -translate-y-1/2 z-20",
          "mr-1 h-8 w-8 rounded-full grid place-items-center",
          "bg-slate-800/80 text-slate-100 border border-slate-700",
          "hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-slate-500",
          canRight ? "opacity-100 cursor-pointer" : "opacity-40 cursor-default",
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
