// components/PresetBar.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";

export default function PresetBar({ presets = [], onInsert }) {
  if (!presets?.length) return null;

  const stripRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = stripRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 0);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    updateArrows();
    const el = stripRef.current;
    if (!el) return;
    const onScroll = () => updateArrows();
    const ro = new ResizeObserver(updateArrows);
    el.addEventListener("scroll", onScroll, { passive: true });
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  const scrollByAmount = (dir = 1) => {
    const el = stripRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.75);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const Chevron = ({ dir = "left", disabled, onClick }) => (
    <button
      type="button"
      aria-label={dir === "left" ? "Scroll left" : "Scroll right"}
      disabled={disabled}
      onClick={onClick}
      className={`
        absolute top-1/2 -translate-y-1/2 z-10
        ${dir === "left" ? "left-0" : "right-0"}
        h-8 w-8 rounded-full
        bg-slate-800/80 border border-slate-600/60
        text-slate-200
        backdrop-blur
        hover:bg-slate-700 disabled:opacity-30
        flex items-center justify-center
        shadow-sm
      `}
      style={{ pointerEvents: disabled ? "none" : "auto" }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        className={dir === "left" ? "" : "rotate-180"}
      >
        <path
          d="M15 6l-6 6 6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  return (
    <div className="sticky top-0 z-20 pt-2 pb-1 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-transparent">
      <div className="relative">
        <Chevron dir="left" disabled={!canLeft} onClick={() => scrollByAmount(-1)} />
        <Chevron dir="right" disabled={!canRight} onClick={() => scrollByAmount(1)} />

        {/* Scrollable strip */}
        <div
          ref={stripRef}
          className="
            preset-strip
            overflow-x-auto overflow-y-hidden
            px-10  /* space for arrows */
            pb-2 -mb-2
          "
        >
          <div className="flex gap-2 w-max">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="
                  preset-btn
                  min-w-max
                  rounded-full
                  border border-slate-600/70
                  bg-slate-800/60
                  px-3 py-1
                  text-xs text-slate-100
                  hover:bg-slate-700
                  transition whitespace-nowrap
                "
                title={p.text?.slice(0, 160)}
                onClick={() => onInsert?.(p.text ?? "")}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
