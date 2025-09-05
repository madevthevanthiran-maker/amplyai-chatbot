// components/ModeTabs.jsx
import { MODE_LIST } from "@/lib/modes";

export default function ModeTabs({ mode, setMode }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODE_LIST.map((t) => (
        <button
          key={t.id}
          onClick={() => setMode(t.id)}
          className={`rounded-full px-3 py-1 text-sm ${
            mode === t.id
              ? "bg-slate-700 text-white"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
