import { useState } from "react";

export default function Settings({ onClose }) {
  const [title, setTitle] = useState("Deep Work: AmplyAI Roadmap");
  const [date, setDate] = useState("2025-09-13");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [tz, setTz] = useState("Asia/Singapore");
  const [loc, setLoc] = useState("Remote");
  const [status, setStatus] = useState(null);

  async function createEvent() {
    setStatus("loading");
    try {
      const res = await fetch("/api/google/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, start, end, tz, loc }),
      });
      const json = await res.json();
      setStatus(json.ok ? "ok" : json.error || "failed");
    } catch (e) {
      setStatus(e.message);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Google Calendar connection */}
      <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700 space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-medium">Google Calendar</span>
          <button className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500">
            Connect Google
          </button>
        </div>
        <p className="text-sm text-slate-400">
          {status === "ok"
            ? "✅ Connected"
            : "🔴 Not connected"}
        </p>
      </div>

      {/* Sample event form */}
      <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700 space-y-3">
        <h2 className="font-semibold">Create a sample event</h2>
        <input
          className="w-full rounded p-2 bg-slate-900 border border-slate-700"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
        />
        <div className="flex gap-2">
          <input
            type="date"
            className="flex-1 rounded p-2 bg-slate-900 border border-slate-700"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            type="time"
            className="w-32 rounded p-2 bg-slate-900 border border-slate-700"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <input
            type="time"
            className="w-32 rounded p-2 bg-slate-900 border border-slate-700"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <input
          className="w-full rounded p-2 bg-slate-900 border border-slate-700"
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          placeholder="Timezone"
        />
        <input
          className="w-full rounded p-2 bg-slate-900 border border-slate-700"
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
          placeholder="Location"
        />
        <button
          onClick={createEvent}
          className="px-4 py-2 rounded bg-green-600 hover:bg-green-500"
        >
          Create event
        </button>
        {status && <p className="text-sm text-slate-300">Status: {status}</p>}
      </div>

      {/* Back to chatbot button */}
      <div className="pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600"
        >
          ← Back to Chatbot
        </button>
      </div>
    </div>
  );
}
