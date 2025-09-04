// components/PresetBar.jsx
import React from "react";

export default function PresetBar({ presets = [], onInsert }) {
  if (!presets?.length) return null;

  return (
    <div className="mb-2 -mt-1">
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            className="whitespace-nowrap rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700"
            title={p.text?.slice(0, 120)}
            onClick={() => onInsert?.(p.text ?? "")}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
