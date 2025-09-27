// ✅ /components/PresetBar.jsx (updated full working version with arrows & working prompt buttons)

import { useEffect, useRef, useState } from "react";

export default function PresetBar({ presets = [], onInsert }) {
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
    };

    update();
    el.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [presets]);

  const scroll = (dir) => {
    const el = containerRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.7;
    el.scrollBy({ left: dir * distance, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 px-2 py-1 text-white bg-slate-700 rounded-l-xl shadow"
        >
          ←
        </button>
      )}
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-10 py-1"
      >
        {presets.map((preset, i) => (
          <button
            key={i}
            onClick={() => onInsert(preset)}
            className="shrink-0 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded-full text-sm"
          >
            {preset}
          </button>
        ))}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 px-2 py-1 text-white bg-slate-700 rounded-r-xl shadow"
        >
          →
        </button>
      )}
    </div>
  );
}
