// /pages/focus.jsx  (or wherever your Focus ChatBox lives)
import { useState, useRef, useEffect } from "react";

export default function FocusPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);

    try {
      const tz =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const r = await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, timezone: tz }),
      });

      const j = await r.json();

      if (!j.ok) {
        // show the server's real error message, not a generic one
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              `⚠ ${j.message}` +
              (j.hint ? `  — ${j.hint}` : "") +
              (j.error ? `\n(${j.error})` : ""),
          },
        ]);
      } else {
        const link = j.created?.htmlLink;
        const when =
          new Date(j.parsed.startISO).toLocaleString() + " → " +
          new Date(j.parsed.endISO).toLocaleString();

        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              `✅ Created: **${j.parsed.title}**\n` +
              `🕒 ${when}\n` +
              (link ? `[Open in Google Calendar](${link})` : ""),
          },
        ]);
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `✗ Calendar error: ${String(e.message || e)}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="p-4">
      <div ref={scrollerRef} className="h-[70vh] overflow-auto mb-3">
        {messages.map((m, i) => (
          <div key={i} className={`mb-2 ${m.role === "user" ? "text-right" : ""}`}>
            <div className="inline-block rounded px-3 py-2 border border-white/10 bg-white/5 whitespace-pre-wrap">
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="opacity-75 text-sm">Creating…</div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <textarea
          className="rounded border border-white/10 bg-white/5 px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder='Try:  "block 2-4pm tomorrow — Deep Work thesis"'
          rows={1}
        />
        <button
          className="rounded px-4 py-2 border border-indigo-400/50 bg-indigo-500/20 hover:bg-indigo-500/30 disabled:opacity-50"
          onClick={send}
          disabled={busy}
        >
          Send
        </button>
      </div>
    </div>
  );
}
