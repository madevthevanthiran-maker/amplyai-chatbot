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
          className={`rounded-full px-3 py-1 text-sm font-medium transition ${
            mode === m.id
              ? "bg-slate-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
