// components/ModeTabs.jsx
export default function ModeTabs({ mode, setMode }) {
  const tabs = [
    { id: "general", label: "Chat (general)" },
    { id: "mailmate", label: "MailMate (email)" },
    { id: "hirehelper", label: "HireHelper (resume)" },
    { id: "planner", label: "Planner (study/work)" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
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
