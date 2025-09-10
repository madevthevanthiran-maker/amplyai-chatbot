// /pages/settings.jsx
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Settings() {
  const [title, setTitle] = useState("Deep Work: AmplyAI Roadmap");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [timezone, setTimezone] = useState("Australia/Melbourne");
  const [location, setLocation] = useState("Remote");
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);

  const [connected, setConnected] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/google/status");
        const j = await r.json();
        if (alive) setConnected(!!j.connected);
      } catch {
        if (alive) setConnected(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function createEvent(e) {
    e?.preventDefault?.();
    setStatus("");
    setCreating(true);

    try {
      const startISO = new Date(`${date}T${startTime}:00`).toISOString().slice(0, 19);
      const endISO   = new Date(`${date}T${endTime}:00`).toISOString().slice(0, 19);

      let res = await fetch("/api/google/calendar/create", {
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
        const url = j?.authUrl || "/api/google/oauth/start?state=%2Fsettings";
        window.location.href = url;
        return;
      }

      // Handle conflict
      if (res.status === 409) {
        const j = await res.json().catch(() => ({}));
        const sug = j?.suggested;

        if (sug?.start && sug?.end) {
          const useSuggested = window.confirm(
            `That slot is busy.\nSuggested next free slot:\n${sug.start} → ${sug.end}\n\nOK = use suggested time\nCancel = create anyway at your original time`
          );
          if (useSuggested) {
            res = await fetch("/api/google/calendar/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                description: "Created from Settings (suggested slot)",
                start: sug.start,
                end: sug.end,
                timezone,
                location,
              }),
            });
          } else {
            res = await fetch("/api/google/calendar/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                description: "Created from Settings (override conflicts)",
                start: startISO,
                end: endISO,
                timezone,
                location,
                allowConflicts: true,
              }),
            });
          }
        } else {
          const override = window.confirm("That time is busy. Create anyway?");
          if (override) {
            res = await fetch("/api/google/calendar/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                description: "Created from Settings (override conflicts)",
                start: startISO,
                end: endISO,
                timezone,
                location,
                allowConflicts: true,
              }),
            });
          } else {
            setStatus("✖ Cancelled.");
            setCreating(false);
            return;
          }
        }
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Settings</h1>
          <div className="flex items-center gap-3">
            <span
              className={[
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border",
                connected == null
                  ? "border-slate-600 text-slate-300"
                  : connected
                  ? "border-emerald-500/50 text-emerald-300"
                  : "border-amber-500/50 text-amber-300",
              ].join(" ")}
              title={
                connected == null
                  ? "Checking Google connection…"
                  : connected
                  ? "Google Calendar connected"
                  : "Google Calendar not connected"
              }
            >
              <span
                className={[
                  "h-2 w-2 rounded-full",
                  connected == null
                    ? "bg-slate-400"
                    : connected
                    ? "bg-emerald-400"
                    : "bg-amber-400",
                ].join(" ")}
              />
              {connected == null ? "Checking…" : connected ? "Google connected" : "Not connected"}
            </span>

            <Link href="/" className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600">
              ← Back to Chatbot
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-6 mb-8">
          <h2 className="text-xl font-medium mb-2">Google Calendar</h2>
          <p className="text-slate-300 mb-4">
            Connect your Google Calendar so Planner can add focus blocks, deadlines, and follow-ups automatically.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a href="/api/google/oauth/start?state=%2Fsettings" className="rounded-xl px-4 py-2 bg-blue-600 hover:bg-blue-500">
              Connect Google Calendar
            </a>
            <a href="/api/google/oauth/logout" className="rounded-xl px-4 py-2 bg-slate-700 hover:bg-slate-600">
              Disconnect
            </a>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-6">
          <h2 className="text-xl font-medium mb-4">Create a sample event</h2>
          <form onSubmit={createEvent} className="grid gap-4">
            {/* Title, date/time, timezone, location inputs (unchanged) */}
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
