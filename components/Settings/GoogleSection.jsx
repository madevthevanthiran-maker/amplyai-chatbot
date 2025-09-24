// /components/Settings/GoogleSection.jsx
import { useState } from "react";

export default function GoogleSection() {
  const [status, setStatus] = useState("");
  const [connected, setConnected] = useState(false);

  async function refreshStatus() {
    const r = await fetch("/api/google/status", { credentials: "include" });
    const j = await r.json();
    setConnected(!!j.connected);
    return j;
  }

  async function connect() {
    // jump to OAuth start on PROD (same origin)
    window.location.href = "/api/google/oauth/start?returnTo=/settings";
  }

  async function disconnect() {
    await fetch("/api/google/oauth/logout", { method: "POST", credentials: "include" });
    setConnected(false);
    setStatus("Disconnected.");
  }

  async function createSample() {
    try {
      setStatus("Creating sample event…");
      const now = Date.now();
      const r = await fetch("/api/google/calendar/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: "AmplyAI Sample Event",
          description: "Created from Settings",
          startISO: new Date(now + 10 * 60 * 1000).toISOString(),
          endISO: new Date(now + 70 * 60 * 1000).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || "Failed");
      setStatus("Sample event created ✅");
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  }

  async function testParseCreate() {
    setStatus("Parsing + creating…");
    const r = await fetch("/api/google/calendar/parse-create", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "next wed 14:30 call with supplier",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      }),
    });
    const j = await r.json();
    if (!r.ok) setStatus("Error: " + (j.message || j.error));
    else setStatus("Created: " + j.parsed.title);
  }

  // refresh once on mount (optional)
  useState(() => { refreshStatus(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-medium">Google Calendar</span>
        <span className={`text-xs px-2 py-0.5 rounded ${connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="flex gap-2">
        <button onClick={connect} className="px-3 py-1.5 rounded bg-black text-white">Connect</button>
        <button onClick={disconnect} className="px-3 py-1.5 rounded bg-gray-200">Disconnect</button>
        <button onClick={createSample} className="px-3 py-1.5 rounded bg-blue-600 text-white">Create sample</button>
        <button onClick={testParseCreate} className="px-3 py-1.5 rounded bg-indigo-600 text-white">Test parse-create</button>
      </div>

      <div className="text-sm text-gray-600">{status}</div>
    </div>
  );
}
