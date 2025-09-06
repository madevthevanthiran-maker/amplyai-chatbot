// /pages/focus.jsx
import { useState } from "react";
import { parseFocusText } from "@/utils/parseFocus";

async function createCalendarEvent(evt) {
  const res = await fetch("/api/google/calendar/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: evt.title,
      description: "Created via Focus Quick Action",
      start: evt.startISO,
      end: evt.endISO,
      timezone: evt.timezone,
      location: "Focus",
    }),
  });
  if (res.status === 401) {
    const { authUrl } = await res.json();
    window.location.href = authUrl;
    return null;
  }
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "Failed to create event");
  }
  return res.json();
}

export default function FocusPage() {
  const [input, setInput] = useState("block 9-11 tomorrow for Deep Work");
  const [status, setStatus] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    setStatus("");
    const parsed = parseFocusText(input);
    if (!parsed.ok) {
      setStatus("✖ " + parsed.error);
      return;
    }
    try {
      const out = await createCalendarEvent(parsed.data);
      if (!out) return; // got redirected to connect
      setStatus("✔ Event created — opening in Calendar…");
      if (out.htmlLink) window.open(out.htmlLink, "_blank", "noopener,noreferrer");
    } catch (err) {
      setStatus("✖ " + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold mb-6">Focus Quick Action</h1>
        <p className="text-slate-300 mb-4">
          Type a command like <code>block 2pm-3:30pm today for sprint review</code> and we’ll create a calendar event.
        </p>
        <form onSubmit={handleCreate} className="grid gap-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-3 outline-none focus:border-blue-500"
            placeholder='block 9-11 tomorrow for Deep Work'
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-500 transition"
          >
            Create focus block
          </button>
          {status && <p className="text-slate-300">{status}</p>}
        </form>
      </div>
    </div>
  );
}
