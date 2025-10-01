// /components/PresetBar.jsx
export default function PresetBar({ presets = [], onInsert, onSend }) {
  if (!presets.length) return null;

  const handleClick = (text) => {
    if (onInsert) onInsert(text);       // still allows typing it in box
    if (onSend) onSend(text);           // ✅ auto-send message
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {presets.map((p, i) => (
        <button
          key={i}
          onClick={() => handleClick(p)}
          className="whitespace-nowrap rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 text-xs transition"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
