// components/QuickActions.jsx
import React from "react";
import { MODE_LIST } from "@/lib/modes";

export default function QuickActions({ activeMode, onPick }) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {MODE_LIST.map((m) => (
        <button
          key={m.id}
          onClick={() => onPick(m)}
          className={`px-3 py-1.5 rounded-full text-sm transition
          ${activeMode === m.id
            ? "bg-blue-600 text-white"
            : "bg-slate-700 hover:bg-slate-600 text-slate-200"}`}
          title={m.description}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
