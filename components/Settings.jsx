// /components/Settings.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

export default function Settings() {
  const router = useRouter();

  const [status, setStatus] = useState({
    connected: false,
    email: null,
    expiresIn: null,
    scopesOk: false,
  });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);

  // form state
  const [title, setTitle] = useState("Deep Work: AmplyAI Roadmap");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [tz, setTz] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  const [location, setLocation] = useState("Remote");

  const sampleParsed = useMemo(() => {
    const startISO = new Date(`${date}T${start}:00`).toISOString();
    const endISO = new Date(`${date}T${end}:00`).toISOString();
    return { title, startISO, endISO, timezone: tz, location };
  }, [title, date, start, end, tz, location]);

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/google/status");
      const j = await r.json();
      setStatus(j);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("gcb")) {
        url.searchParams.delete("gcb");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  // IMPORTANT: navigate (don’t fetch) to start OAuth
  const startHref = `/api/google/oauth/start?returnTo=${encodeURIComponent(
    "/settings"
  )}`;

  const onConnect = () => {
    // Either use a normal <a href={startHref}> or do this:
    window.location.assign(startHref);
  };

  const onDisconnect = () => {
    window.location.assign("/api/google/oauth/logout?returnTo=/settings");
  };

  const onBackToChat = () => router.push("/chat");

  const createSample = async () => {
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
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>

      {/* Google Calendar */}
      <section className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Google Calendar</h2>
          {status.connected ? (
            <button
              className="px-3 py-1.5 rounded-md border border-white/20 bg-white/10 hover:bg-white/15"
              onClick={onDisconnect}
            >
              Disconnect
            </button>
          ) : (
            // You can make this an <a> to be 100% sure no fetch happens:
            // <a className="..." href={startHref}>Connect Google</a>
            <button
              className="px-3 py-1.5 rounded-md border border-indigo-400/50 bg-indigo-500/20 hover:bg-indigo-500/30"
              onClick={onConnect}
            >
              Connect Google
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center gap-3">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${
              status.connected ? "bg-green-400" : "bg-rose-400"
            }`}
          />
          <div className="text-sm opacity-90">
            {loading
              ? "Checking…"
              : status.connected
              ? `Connected${
                  status.email ? ` as ${status.email}` : ""
                }${
                  typeof status.expiresIn === "number"
                    ? ` — expires in ~${Math.max(
                        0,
                        Math.floor(status.expiresIn / 60)
                      )} min`
                    : ""
                }`
              : "Not connected"}
          </div>
          <button
            className="ml-auto px-3 py-1.5 rounded-md border border-white/20 bg-white/10 hover:bg-white/15"
            onClick={refreshStatus}
          >
            Refresh
          </button>
        </div>
      </section>

      {/* Sample Event */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-medium mb-3">Create a sample event</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="col-span-2 text-sm opacity-80">
            Title
            <input
              className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="text-sm opacity-80">
            Date
            <input
              type="date"
              className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm opacity-80">
              Start
              <input
                type="time"
                className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label className="text-sm opacity-80">
              End
              <input
                type="time"
                className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>

          <label className="col-span-2 text-sm opacity-80">
            Timezone (IANA)
            <input
              className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
              value={tz}
              onChange={(e) => setTz(e.target.value)}
            />
          </label>

          <label className="col-span-2 text-sm opacity-80">
            Location
            <input
              className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
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
          {result &&
            (result.ok ? (
              <a
                className="text-emerald-300 underline"
                href={result.created?.htmlLink || "#"}
                target="_blank"
                rel="noreferrer"
              >
                ✓ Created (open in Calendar)
              </a>
            ) : (
              <span className="text-rose-300">
                ✗ {result.message || "Failed to create event"}
                {result.hint ? ` — ${result.hint}` : ""}
              </span>
            ))}
        </div>
      </section>

      <div className="pt-6">
        <button
          onClick={onBackToChat}
          className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600"
        >
          ← Back to Chatbot
        </button>
      </div>
    </div>
  );
}
