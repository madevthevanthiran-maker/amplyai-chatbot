// components/Settings.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

export default function Settings() {
  const router = useRouter();

  const [status, setStatus] = useState({
    connected: false,
    email: null,
    expiresIn: null,
    scopesOk: null,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);

  // form state
  const [title, setTitle] = useState("Deep Work: AmplyAI Roadmap");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [tz, setTz] = useState(
    (typeof Intl !== "undefined" &&
      Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      "UTC"
  );
  const [location, setLocation] = useState("Remote");

  const sampleParsed = useMemo(() => {
    const startISO = new Date(`${date}T${start}:00`).toISOString();
    const endISO = new Date(`${date}T${end}:00`).toISOString();
    return {
      title,
      start: startISO,
      end: endISO,
      tz,
      location,
      allDay: false,
      intent: "event",
    };
  }, [title, date, start, end, tz, location]);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/google/status");
      const j = await r.json();
      // Accept both shapes:
      // {ok:true, status:{connected,...}}  OR  {connected, ...}
      const s = j?.status ?? j ?? {};
      setStatus({
        connected: !!s.connected,
        email: s.email ?? null,
        expiresIn: s.expiresIn ?? null,
        scopesOk: s.scopesOk ?? null,
      });
    } catch {
      setStatus((prev) => ({ ...prev, connected: false }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();

    // Listen for popup -> postMessage from /api/google/oauth/callback
    const onMsg = (e) => {
      if (e?.data?.source === "amply-google" && e?.data?.ok) {
        setTimeout(refreshStatus, 300);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [refreshStatus]);

  async function onConnect() {
    try {
      const r = await fetch("/api/google/oauth/start");
      const j = await r.json();
      if (!j.ok || !j.url) throw new Error(j.error || "No auth URL");
      const w = 520,
        h = 640;
      const y = window.top.outerHeight / 2 + window.top.screenY - h / 2;
      const x = window.top.outerWidth / 2 + window.top.screenX - w / 2;
      window.open(j.url, "amply-gcal", `width=${w},height=${h},left=${x},top=${y}`);
    } catch (e) {
      alert("Failed to start Google sign-in: " + e.message);
    }
  }

  async function onDisconnect() {
    try {
      const r = await fetch("/api/google/oauth/logout", { method: "POST" });
      if (!r.ok) throw new Error("Logout failed");
    } catch (e) {
      // best effort
      console.warn(e);
    } finally {
      refreshStatus();
    }
  }

  const onBackToChat = () => router.push("/chat");

  async function createSample() {
    try {
      setCreating(true);
      setResult(null);
      // Back end now accepts either {text} or {parsed}
      const r = await fetch("/api/google/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsed: sampleParsed }),
      });
      const j = await r.json();
      setResult(j.ok ? { ok: true, created: j.event } : { ok: false, message: j.error, hint: j.hint });
    } catch (e) {
      setResult({ ok: false, message: e.message });
    } finally {
      setCreating(false);
    }
  }

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
              ? `Connected${status.email ? ` as ${status.email}` : ""}${
                  typeof status.expiresIn === "number"
                    ? ` — token ~${Math.max(0, Math.floor(status.expiresIn / 60))} min left`
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
