import { useState } from "react";
import parseFocus from "@/utils/parseFocus";

export default function FocusPlayground() {
  const [text, setText] = useState("block 2-4pm tomorrow — Deep Work thesis");
  const [tz, setTz] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  function onPreview() {
    try {
      const p = parseFocus(text, { timezone: tz });
      setPreview(p);
      setError("");
    } catch (e) {
      setPreview(null);
      setError(String(e.message || e));
    }
  }

  async function onCreate() {
    setError("");
    setPreview(null);
    try {
      const r = await fetch("/api/google/calendar/parse-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, timezone: tz }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || "Create failed");
      setPreview(j.parsed);
      if (j.created?.htmlLink) window.open(j.created.htmlLink, "_blank");
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Focus (debug)</h1>

      <label className="block mb-3 text-sm opacity-80">
        Prompt
        <textarea
          className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      <label className="block mb-4 text-sm opacity-80">
        Timezone (IANA)
        <input
          className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2"
          value={tz}
          onChange={(e) => setTz(e.target.value)}
        />
      </label>

      <div className="flex gap-3">
        <button
          onClick={onPreview}
          className="px-4 py-2 rounded-md border border-white/20 bg-white/10 hover:bg-white/15"
        >
          Preview parse
        </button>
        <button
          onClick={onCreate}
          className="px-4 py-2 rounded-md border border-emerald-400/50 bg-emerald-500/20 hover:bg-emerald-500/30"
        >
          Create calendar event
        </button>
      </div>

      {!!error && <div className="mt-4 text-rose-300">⚠︎ {error}</div>}
      {!!preview && (
        <pre className="mt-4 text-sm bg-white/5 border border-white/10 rounded p-3 overflow-auto">
{JSON.stringify(preview, null, 2)}
        </pre>
      )}
    </div>
  );
}
