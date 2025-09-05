// components/PresetBar.jsx
export default function PresetBar({ presets = [], onInsert }) {
  if (!presets?.length) return null;
  return (
    <div className="no-scrollbar mb-2 -mt-1 overflow-x-auto">
      <div className="flex gap-2 py-1">
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            title={p.text.slice(0, 120)}
            className="preset-btn"
            onClick={() => onInsert?.(p.text || "")}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
