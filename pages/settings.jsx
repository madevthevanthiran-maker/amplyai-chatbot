// /pages/settings.jsx
import { useMemo, useState } from "react";

export default function Settings() {
  const [title, setTitle] = useState("Deep Work: AmplyAI Roadmap");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [timezone, setTimezone] = useState("Australia/Melbourne");
  const [location, setLocation] = useState("Remote");
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);

  // Build a stable absolute URL for OAuth (avoid preview URLs)
  const APP_URL = useMemo(
    () => process.env.NEXT_PUBLIC_APP_URL || "",
    []
  );

  const connectHref = useMemo(() => {
    // If APP_URL is missing, we still build something non-empty to avoid empty href.
    const base = APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const state = encodeURIComponent("/settings");
    return `${base}/api/google/oauth/start?state=${state}`;
  }, [APP_URL]);

  async function createEvent(e) {
    e.preventDefault();
    setStatus("");
    setCreating(true);
    try {
      // Compose ISO strings from date + time (seconds added for API)
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
        // Not connected → let server tell us the exact URL (will already be absolute)
        const j = await res.json().catch(() => ({}));
        const url = j?.authUrl || connectHref;
        window.location.href = url;
        return;
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to create event");
      }

      const data = await res.json();
      setStatus(
        `✔ Event created.${data.htmlLink ? " Opening in a new tab…" : ""}`
      );
      if (data.htmlLink) {
        // open in new tab to verify
        window.open(data.htmlLink, "_blank", "noopener,noreferrer");
      }
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

        {/* Google Calendar Connect */}
        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-6 mb-8">
          <h2 className="text-xl font-medium mb-2">Google Calendar</h2>
          <p className="text-slate-300 mb-4">
            Connect your Google Calendar so Planner can add focus blocks, deadlines,
            and follow-ups automatically.
          </p>

          {!APP_URL && (
            <div className="mb-3 text-sm text-amber-300">
              <strong>Heads up:</strong> <code>NEXT_PUBLIC_APP_URL</code> is not set.
              OAuth may fail on preview URLs. Set it to your production domain in
              Vercel env and redeploy.
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <a
              href={connectHref}
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
          </div>
        </div>

        {/* Create sample event */}
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
          </form>
        </div>
      </div>
    </div>
  );
}
