// /components/ModeTabs.jsx
export default function ModeTabs({ mode, setMode }) {
  const modes = [
    { id: "general", label: "Chat (general)" },
    { id: "mailmate", label: "MailMate (email)" },
    { id: "hirehelper", label: "HireHelper (resume)" },
    { id: "planner", label: "Planner (study/work)" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            mode === m.id
              ? "bg-slate-100 text-slate-900"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
