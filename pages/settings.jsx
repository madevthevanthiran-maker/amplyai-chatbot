// /pages/settings.jsx
import { useState } from "react";

export default function Settings() {
  const [title, setTitle] = useState("Deep Work: AmplyAI Roadmap");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [timezone, setTimezone] = useState("Australia/Melbourne");
  const [location, setLocation] = useState("Remote");
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [conflicts, setConflicts] = useState([]);

  async function createEvent(e) {
    e.preventDefault();
    setStatus("");
    setConflicts([]);
    setCreating(true);
    try {
      const startISO = new Date(`${date}T${startTime}:00`).toISOString().slice(0, 19);
      const endISO = new Date(`${date}T${endTime}:00`).toISOString().slice(0, 19);

      const res = await fetch("/api/google/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: "Created from AmplyAI Settings page",
          start: startISO,
          end: endISO,
          timezone,
          location,
        }),
      });

      if (res.status === 401) {
        const j = await res.json().catch(() => ({}));
        window.location.href = j?.authUrl || "/api/google/oauth/start?state=%2Fsettings";
        return;
      }

      if (res.status === 409) {
        const j = await res.json().catch(() => ({}));
        setConflicts(j?.conflicts || []);
        setStatus("⚠️ That time conflicts with existing events.");
        return;
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to create event");
      }

      const data = await res.json();
      setStatus(`✔ Event created.${data.htmlLink ? " Opening in a new tab…" : ""}`);
      if (data.htmlLink) window.open(data.htmlLink, "_blank", "noopener,noreferrer");
    } catch (err) {
      setStatus(`✖ ${err.message}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold mb-6">Settings</h1>

        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-6 mb-8">
          <h2 className="text-xl font-medium mb-2">Google Calendar</h2>
          <p className="text-slate-300 mb-4">
            Connect your Google Calendar so Planner can add focus blocks, deadlines, and follow-ups automatically.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a
              href="/api/google/oauth/start?state=%2Fsettings"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-blue-600 hover:bg-blue-500 transition"
            >
              Connect Google Calendar
            </a>
            <a
              href="/api/google/oauth/logout"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-slate-700 hover:bg-slate-600 transition"
            >
              Disconnect
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-slate-600 hover:bg-slate-500 transition"
            >
              ← Back to chat
            </a>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-6">
          <h2 className="text-xl font-medium mb-4">Create a sample event</h2>
          <form onSubmit={createEvent} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-slate-300">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                placeholder="Event title"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="grid gap-2">
                <span className="text-slate-300">Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-slate-300">Start</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-slate-300">End</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-slate-300">Timezone (IANA)</span>
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                placeholder="e.g., Australia/Melbourne"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-slate-300">Location</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                placeholder="Meeting link or place"
              />
            </label>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition"
              >
                {creating ? "Creating…" : "Create event"}
              </button>
              {status && <p className="text-sm text-slate-300">{status}</p>}
            </div>

            {conflicts.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-600 bg-amber-900/20 p-3 text-amber-200">
                <div className="font-medium mb-1">Conflicts</div>
                <ul className="list-disc pl-5 space-y-1">
                  {conflicts.map((c) => (
                    <li key={c.id}>
                      <span className="font-medium">{c.summary || "(busy)"}</span>{" "}
                      <span className="opacity-80">
                        ({(c.start?.dateTime || c.start?.date) ?? "?"} → {(c.end?.dateTime || c.end?.date) ?? "?"})
                      </span>{" "}
                      {c.htmlLink && (
                        <a
                          href={c.htmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="underline hover:opacity-80"
                        >
                          open
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
