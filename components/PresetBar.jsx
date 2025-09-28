// /components/PresetBar.jsx

import { useEffect, useRef } from "react";

export default function PresetBar({ presets = [], onInsert }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (!containerRef.current) return;
      if (e.detail && typeof e.detail === "string") {
        onInsert?.(e.detail);
      }
    };
    window.addEventListener("amplyai.insertPreset", handle);
    return () => window.removeEventListener("amplyai.insertPreset", handle);
  }, [onInsert]);

  if (!presets.length) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide" ref={containerRef}>
      {presets.map((text, i) => (
        <button
          key={i}
          onClick={() => onInsert(text)}
          className="shrink-0 rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800 transition"
        >
          {text.length > 30 ? text.slice(0, 30) + "…" : text}
        </button>
      ))}
    </div>
  );
}
