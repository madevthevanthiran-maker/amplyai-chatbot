// components/PresetBar.jsx
import React from "react";

/**
 * Horizontal preset buttons with a visible bottom scrollbar.
 * - Put all prompt chips in a scrollable strip.
 * - Uses 'preset-strip' class to style & keep space for the scrollbar.
 */
export default function PresetBar({ presets = [], onInsert }) {
  if (!presets?.length) return null;

  return (
    <div className="mb-2 -mt-1">
      {/* The strip that shows chips + a visible horizontal scrollbar */}
      <div
        className="
          preset-strip
          overflow-x-auto
          overflow-y-hidden
          pb-2
          -mb-2
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
                transition
                whitespace-nowrap
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
  );
}
