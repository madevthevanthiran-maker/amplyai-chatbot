import { useEffect, useRef, useState } from "react";

export default function PresetBar({ presets, onInsert }) {
  const containerRef = useRef(null);
  const [showArrows, setShowArrows] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const checkOverflow = () => {
      setShowArrows(container?.scrollWidth > container?.clientWidth);
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [presets]);

  return (
    <div className="relative">
      {showArrows && (
        <>
          <button
            onClick={() => (containerRef.current.scrollLeft -= 150)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-slate-800 px-2 py-1 rounded-l-md shadow"
          >
            ◀
          </button>
          <button
            onClick={() => (containerRef.current.scrollLeft += 150)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-slate-800 px-2 py-1 rounded-r-md shadow"
          >
            ▶
          </button>
        </>
      )}

      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-4"
      >
        {presets.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => onInsert(preset)}
            className="bg-slate-700 text-sm text-white px-3 py-1 rounded-full whitespace-nowrap hover:bg-slate-600 transition"
          >
            {preset.length > 40 ? preset.slice(0, 37) + "..." : preset}
          </button>
        ))}
      </div>
    </div>
  );
}
