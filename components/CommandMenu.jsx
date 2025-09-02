// components/CommandMenu.jsx
import React from "react";

export default function CommandMenu({ open, onClose, tabs = [], current, onSelect }) {
  const [q, setQ] = React.useState("");
  const [idx, setIdx] = React.useState(0);
  const listRef = React.useRef(null);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose?.(); else setQ(""), setIdx(0), onSelect?.("__noop__"); // noop to keep parent hot
      }
      if (!open) return;

      if (e.key === "Escape") { e.preventDefault(); onClose?.(); }
      if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[idx];
        if (item) { onSelect?.(item.key); onClose?.(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, idx]); // eslint-disable-line

  const filtered = tabs
    .filter((t) => t.label.toLowerCase().includes(q.toLowerCase()))
    .map((t) => ({ ...t, active: t.key === current }));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4"
         onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900/95 shadow-xl"
           onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => { setQ(e.target.value); setIdx(0); }}
          placeholder="Switch to… (type to filter)"
          className="w-full px-4 py-3 bg-transparent text-gray-100 placeholder-gray-500 outline-none border-b border-gray-800"
        />
        <div ref={listRef} className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-2 text-sm text-gray-400">No matches</div>
          )}
          {filtered.map((t, i) => (
            <button
              key={t.key}
              className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between
                ${i === idx ? "bg-gray-800 text-gray-100" : "text-gray-300 hover:bg-gray-800/60"}`}
              onMouseEnter={() => setIdx(i)}
              onClick={() => { onSelect?.(t.key); onClose?.(); }}
            >
              <span>{t.label}</span>
              {t.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300">current</span>}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 text-[11px] text-gray-500 border-t border-gray-800">
          Tip: <span className="text-gray-300 font-medium">⌘/Ctrl + K</span> to open · <span className="text-gray-300 font-medium">Esc</span> to close
        </div>
      </div>
    </div>
  );
}
