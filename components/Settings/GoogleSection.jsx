// /components/Settings/GoogleSection.jsx
import { useEffect, useState } from "react";

export default function GoogleSection() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("");
  const [redirectUri, setRedirectUri] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/google/status");
        const j = await r.json();
        if (j.ok) {
          setConnected(!!j.connected);
          setRedirectUri(j.redirectUri || "");
        }
      } catch {}
    })();
  }, []);

  async function connect() {
    setStatus("Opening Google consent…");
    window.location.href = "/api/google/oauth/start";
  }

  async function disconnect() {
    setStatus("Disconnecting…");
    try { await fetch("/api/google/oauth/logout"); } catch {}
    setConnected(false);
    setStatus("Disconnected.");
  }

  async function createSample() {
    try {
      setStatus("Creating sample event…");
      const now = new Date();
      const startISO = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
      const endISO = new Date(now.getTime() + 70 * 60 * 1000).toISOString();

      const r = await fetch("/api/google/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: "AmplyAI Sample Event",
          description: "Created from Settings",
          startISO,
          endISO,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || j.error || "Create failed");
      setStatus("Sample event created ✅");
    } catch (e) {
      setStatus("Error: " + (e.message || e));
    }
  }

  async function testParseCreate() {
    try {
      setStatus("Parsing + creating…");
      const r = await fetch("/api/google/calendar/parse-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "next wed 14:30 — call with supplier",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || j.error);
      setStatus(`Created: ${j.parsed.title}`);
    } catch (e) {
      setStatus("Error: " + (e.message || e));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-medium">Google Calendar</span>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="text-xs opacity-70">
        Redirect URI your project must allow: <code>{redirectUri || "(loading…)"}</code>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={connect} className="px-3 py-1.5 rounded bg-black text-white">
          Connect
        </button>
        <button onClick={disconnect} className="px-3 py-1.5 rounded bg-gray-200">
          Disconnect
        </button>
        <button
          onClick={createSample}
          disabled={!connected}
          className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          Create sample event
        </button>
        <button
          onClick={testParseCreate}
          disabled={!connected}
          className="px-3 py-1.5 rounded bg-indigo-600 text-white disabled:opacity-50"
        >
          Test parse-create
        </button>
      </div>

      <div className="text-sm text-gray-600">{status}</div>
    </div>
  );
}
