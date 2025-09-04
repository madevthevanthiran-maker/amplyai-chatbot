// components/PresetBar.jsx
import React from "react";

/**
 * PresetBar
 * props:
 *  - presets: Array<{ label: string, text: string }>
 *  - onInsert: (text: string) => void
 */
export default function PresetBar({ presets = [], onInsert }) {
  if (!presets?.length) return null;

  return (
    <div className="mb-2 -mt-1">
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            className="preset-btn"
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
