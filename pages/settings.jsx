// /pages/settings.jsx
import { useEffect, useMemo, useState } from "react";

const FEATURE_CALENDAR =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_FEATURE_CALENDAR ?? "true") !== "false"
    : true;

export default function SettingsPage() {
  const [status, setStatus] = useState({ connected: false, email: null, expiresIn: null, scopesOk: false });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);

  // sample form
  const [title, setTitle] = useState("Deep Work: AmplyAI Roadmap");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [location, setLocation] = useState("Remote");

  const sampleParsed = useMemo(() => {
    const startISO = new Date(`${date}T${start}:00`).toISOString();
    const endISO = new Date(`${date}T${end}:00`).toISOString();
    return { title, startISO, endISO, timezone: tz, location };
  }, [title, date, start, end, tz, location]);

  async function refreshStatus() {
    try {
      setLoading(true);
      const r = await fetch("/api/google/status");
      const j = await r.json();
      setStatus(j);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshStatus();
    // also refresh when coming back from OAuth callback (gcb param)
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("gcb")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("gcb");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  async function connect() {
    window.location.href = "/api/google/oauth/start?returnTo=/settings";
  }
  async function disconnect() {
    window.location.href = "/api/google/oauth/logout?returnTo=/settings";
  }

  async function createSample() {
    try {
      setCreating(true);
      setResult(null);
      const r = await fetch("/api/google/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsed: sampleParsed }),
      });
      const j = await r.json();
      setResult(j);
      if (!j.ok) throw new Error(j.message || "Failed to create event");
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>

      <section className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-medium mb-2">Google Calendar</h2>

        {!FEATURE_CALENDAR && (
          <div className="text-amber-300 mb-3">
            Calendar feature is disabled (NEXT_PUBLIC_FEATURE_CALENDAR=false).
          </div>
        )}

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${
              status.connected ? "bg-green-400" : "bg-rose-400"
            }`}
          />
          <div className="text-sm opacity-90">
            {loading ? "Checking…" : status.connected ? (
              <>
                Connected{status.email ? ` as ${status.email}` : ""}{" "}
                {!status.scopesOk && <span className="text-amber-300">(token needs refresh)</span>}
                {typeof status.expiresIn === "number" && (
                  <span className="opacity-70"> — expires in ~{Math.max(0, Math.floor(status.expiresIn / 60))} min</span>
                )}
              </>
            ) : (
              "Not connected"
            )}
          </div>
          <div className="ml-auto flex gap-2">
            {status.connected ? (
              <>
                <button className="px-3 py-1.5 rounded-md border border-white/20 bg-white/10 hover:bg-white/15"
                        onClick={refreshStatus}>Refresh</button>
                <button className="px-3 py-1.5 rounded-md border border-white/20 bg-white/10 hover:bg-white/15"
                        onClick={disconnect}>Disconnect</button>
              </>
            ) : (
              <button className="px-3 py-1.5 rounded-md border border-indigo-400/50 bg-indigo-500/20 hover:bg-indigo-500/30"
                      onClick={connect}>Connect Google</button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-medium mb-3">Create a sample event</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="col-span-2 text-sm opacity-80">
            Title
            <input className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
                   value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label className="text-sm opacity-80">
            Date
            <input type="date" className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
                   value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm opacity-80">
              Start
              <input type="time" className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
                     value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="text-sm opacity-80">
              End
              <input type="time" className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
                     value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>

          <label className="col-span-2 text-sm opacity-80">
            Timezone (IANA)
            <input className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
                   value={tz} onChange={(e) => setTz(e.target.value)} />
          </label>

          <label className="col-span-2 text-sm opacity-80">
            Location
            <input className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
                   value={location} onChange={(e) => setLocation(e.target.value)} />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            className="px-4 py-2 rounded-md border border-emerald-400/50 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50"
            onClick={createSample}
            disabled={creating}
          >
            {creating ? "Creating…" : "Create event"}
          </button>
          {result && (
            result.ok ? (
              <a className="text-emerald-300 underline" href={result.created?.htmlLink || "#"} target="_blank" rel="noreferrer">
                ✓ Created (open in Calendar)
              </a>
            ) : (
              <span className="text-rose-300">✗ {result.message || "Failed to create event"}</span>
            )
          )}
        </div>
      </section>
    </div>
  );
}
