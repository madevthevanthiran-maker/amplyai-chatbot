// components/PresetBar.jsx
import { useRef } from "react";

export default function PresetBar({ presets = [], onInsert }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -150 : 150,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* Scroll Left Button */}
      {presets.length > 6 && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-slate-800 p-2 text-white hover:bg-slate-700"
        >
          ←
        </button>
      )}

      {/* Scrollable Presets */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-2 overflow-x-auto px-8 py-2"
      >
        {presets.map((preset, i) => (
          <button
            key={i}
            onClick={() => onInsert(preset.text)}
            className="whitespace-nowrap rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Scroll Right Button */}
      {presets.length > 6 && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-slate-800 p-2 text-white hover:bg-slate-700"
        >
          →
        </button>
      )}
    </div>
  );
}
