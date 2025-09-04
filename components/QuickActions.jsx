// components/QuickActions.jsx
import React from "react";
import { MODE_LIST, MODES } from "@/lib/modes";

export default function QuickActions({ activeMode = "general", onPick }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {MODE_LIST.map((m) => {
        const isActive = m.id === activeMode;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onPick?.(MODES[m.id])}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              isActive
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700"
            }`}
          >
            {m.title}
          </button>
        );
      })}
    </div>
  );
}
