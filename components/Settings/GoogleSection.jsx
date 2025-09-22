import { useState } from "react";

const PROD_ORIGIN = "https://amplyai-chatbot.vercel.app";
const API_BASE = PROD_ORIGIN; // always hit prod so cookies live on prod

export default function GoogleSection({
  initialConnected = false,
  initialTokens = null,   // kept for backward compat, but not required
  onTokens,
}) {
  const [connected, setConnected] = useState(initialConnected);
  const [status, setStatus] = useState("");

  async function connect() {
    // Start OAuth *on prod* and round-trip current origin in `returnTo`
    const returnTo = window.location.origin;
    const url = new URL(`${PROD_ORIGIN}/api/google/oauth/start`);
    url.searchParams.set("returnTo", returnTo);
    setStatus("Opening Google consent…");
    window.location.href = url.toString();
  }

  async function disconnect() {
    try {
      setStatus("Disconnecting…");
      await fetch(`${API_BASE}/api/google/oauth/logout`, { method: "POST" });
      setConnected(false);
      onTokens?.(null);
      setStatus("Disconnected.");
    } catch (e) {
      setStatus("Error: " + (e.message || String(e)));
    }
  }

  async function createSample() {
    try {
      setStatus("Creating sample event…");
      const now = new Date();
      const startISO = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
      const endISO = new Date(now.getTime() + 70 * 60 * 1000).toISOString();

      const r = await fetch(`${API_BASE}/api/google/calendar/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: "AmplyAI Sample Event",
          description: "Created from Settings",
          startISO,
          endISO,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          // tokens, // ← only if your API still accepts tokens in body (not recommended)
        }),
        credentials: "include", // send cookies to prod
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok || data?.ok === false) {
        throw new Error(data?.message || data?.error || `HTTP ${r.status}`);
      }

      setStatus("Sample event created ✅");
      setConnected(true);
      // if (data.tokens) onTokens?.(data.tokens);
    } catch (e) {
      setStatus("Error: " + (e.message || String(e)));
    }
  }

  async function testParseCreate(text) {
    try {
      setStatus("Parsing + creating…");
      const r = await fetch(`${API_BASE}/api/google/calendar/parse-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          // tokens,
        }),
        credentials: "include",
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok || data?.ok === false) {
        throw new Error(data?.message || data?.error || `HTTP ${r.status}`);
      }

      setStatus(`Created: ${data.parsed?.title || "event"} ✅`);
      setConnected(true);
      // if (data.tokens) onTokens?.(data.tokens);
    } catch (e) {
      setStatus("Error: " + (e.message || String(e)));
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

      <div className="flex flex-wrap gap-2">
        <button onClick={connect} className="px-3 py-1.5 rounded bg-black text-white">
          Connect
        </button>
        <button onClick={disconnect} className="px-3 py-1.5 rounded bg-gray-200">
          Disconnect
        </button>
        <button
          onClick={createSample}
          className="px-3 py-1.5 rounded bg-blue-600 text-white"
        >
          Create sample event
        </button>
        <button
          onClick={() => testParseCreate("next wed 14:30 call with supplier")}
          className="px-3 py-1.5 rounded bg-indigo-600 text-white"
        >
          Test parse-create
        </button>
      </div>

      <div className="text-sm text-gray-600">{status}</div>
    </div>
  );
}
