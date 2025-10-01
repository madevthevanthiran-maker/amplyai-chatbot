// components/PresetBar.jsx

import { useEffect, useRef, useState } from "react";

export default function PresetBar({ presets = [], onInsert }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      const el = scrollRef.current;
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
    };
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scrollBy = (delta) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          onClick={() => scrollBy(-150)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded-full shadow text-white"
          aria-label="Scroll left"
        >
          ◀
        </button>
      )}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar gap-2 px-8 py-2"
      >
        {presets.map((preset, i) => (
          <button
            key={i}
            onClick={() => onInsert(preset.text)}
            className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-sm text-white hover:bg-slate-700 border border-slate-700"
          >
            {preset.label}
          </button>
        ))}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scrollBy(150)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded-full shadow text-white"
          aria-label="Scroll right"
        >
          ▶
        </button>
      )}
    </div>
  );
}
