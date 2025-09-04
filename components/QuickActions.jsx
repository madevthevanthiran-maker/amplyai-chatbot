// components/QuickActions.jsx
import React from "react";
import { MODE_LIST, MODES } from "@/lib/modes";

export default function QuickActions({ activeMode, onPick }) {
  // Guard against import issues so SSR can't crash:
  const modes = Array.isArray(MODE_LIST) ? MODE_LIST : Object.values(MODES).map(m => ({ id: m.id, title: m.title }));

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {modes.map((m) => {
        const isActive = m.id === activeMode;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onPick?.(MODES[m.id])}
            className={`px-3 py-1.5 rounded-full text-sm border transition
              ${isActive
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700"}`}
          >
            {m.title}
          </button>
        );
      })}
    </div>
  );
}
