// /components/PresetBar.jsx
export default function PresetBar({ presets = [], onInsert, onSend }) {
  if (!presets.length) return null;

  const handleClick = (text, e) => {
    if (e.shiftKey) {
      // SHIFT+click → only insert into the input
      if (onInsert) onInsert(text);
    } else {
      // normal click → auto-send immediately
      if (onSend) onSend(text);
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {presets.map((p, i) => (
        <button
          key={i}
          onClick={(e) => handleClick(p, e)}
          className="whitespace-nowrap rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 text-xs transition"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
