export default function PresetBar({ presets = [], onInsert }) {
  if (!presets || presets.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {presets.map((preset, i) => (
        <button
          key={i}
          onClick={() => onInsert(preset)}
          className="shrink-0 px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 transition"
        >
          {preset}
        </button>
      ))}
    </div>
  );
}
