import { useEffect, useRef, useState } from "react";
import ChatInput from "./ChatInput";
import PresetBar from "./PresetBar";
import presets from "./presets";

/**
 * ChatPanel (single-stack with editable presets)
 * ---------------------------------------------
 * Changes:
 * - Preset clicks now **prefill the input** (do NOT auto-send).
 * - We focus the textarea and move the caret to the end so the user can tweak.
 * - Press Enter or click Send to submit.
 */

const DISPLAY_TZ =
  typeof window !== "undefined"
    ? (Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC")
    : "UTC";

function fmtDT(iso, locale = "en-US", timeZone = DISPLAY_TZ) {
  try {
    return new Date(iso).toLocaleString(locale, {
      timeZone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return new Date(iso).toLocaleString();
  }
}

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I assist you today?" },
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState("general");
  const [tokens, setTokens] = useState(null);

  // NEW: draft input (controlled) + ref so we can focus after preset click
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  // Load Google auth status (non-fatal if it fails)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/google/status");
        const data = await res.json();
        if (data?.connected) setTokens(data.tokens ?? true);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const add = (msg) => setMessages((prev) => [...prev, msg]);

  const handleSend = async (text) => {
    add({ role: "user", content: text });
    setDraft(""); // clear the input after we take the current value
    setLoading(true);

    try {
      const isCalendarLike =
        selectedMode === "focus" ||
        /\b(block|calendar|schedule|meeting|mtg|event|call|appointment|appt)\b/i.test(
          text
        );

      if (isCalendarLike) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "calendar", message: text, tokens }),
        });
        const data = await res.json();

        if (!res.ok) {
          add({
            role: "assistant",
            content: `❌ Calendar error: ${data.message || data.error || "Not connected"}`,
          });
        } else if (data?.parsed) {
          const { title, startISO, endISO } = data.parsed;
          add({
            role: "assistant",
            content: `📅 **Created:** ${title}\n🕒 ${fmtDT(startISO)} → ${fmtDT(
              endISO
            )} (${DISPLAY_TZ})`,
          });
        } else {
          add({ role: "assistant", content: "⚠️ I couldn't parse that into an event." });
        }
        setLoading(false);
        return;
      }

      // Default GPT route
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Request failed");
      add({ role: "assistant", content: data.reply || "(no reply)" });
    } catch (err) {
      console.error("[/api/chat] error", { text, err });
      add({ role: "assistant", content: `❌ ${err.message}` });
    } finally {
      setLoading(false);
      // refocus input for faster follow-ups
      if (inputRef.current) inputRef.current.focus();
    }
  };

  // Fill input with preset text (do not send), focus, and move caret to end
  const handlePresetClick = (text) => {
    const t = text ?? "";
    setDraft(t);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const el = inputRef.current;
        el.focus();
        // place caret at end
        const len = t.length;
        try {
          el.setSelectionRange?.(len, len);
        } catch {}
      }
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-[#0b0f1a]">
      {/* Mode tabs */}
      <div className="mx-auto max-w-3xl px-3 py-2 flex flex-wrap gap-2 text-sm">
        {[
          ["general", "Chat (general)"],
          ["mailmate", "MailMate (email)"],
          ["hirehelper", "HireHelper (resume)"],
          ["planner", "Planner (study/work)"],
          ["focus", "Focus"],
        ].map(([value, label]) => {
          const active = selectedMode === value;
          return (
            <button
              key={value}
              onClick={() => setSelectedMode(value)}
              className={`px-3 py-1.5 rounded-full border ${
                active
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Single preset bar — now fills the input instead of sending */}
      <div className="mx-auto w-full max-w-3xl px-3">
        <PresetBar
          presets={presets[selectedMode] || []}
          selectedMode={selectedMode}
          onInsert={handlePresetClick}
        />
      </div>

      {/* Messages */}
      <div className="mx-auto w-full max-w-3xl px-3 md:px-4">
        <div className="space-y-3 pb-28">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap leading-relaxed rounded-2xl px-4 py-3 border ${
                m.role === "user"
                  ? "bg-indigo-600/20 text-indigo-100 border-indigo-400/20 self-end"
                  : "bg-white/10 text-white border-white/10 self-start"
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && <div className="text-sm text-white/60">Assistant is typing…</div>}
        </div>
      </div>

      {/* Controlled input: Enter-to-send, Shift+Enter for newline */}
      <ChatInput
        value={draft}
        onChange={setDraft}
        onSend={handleSend}
        disabled={loading}
        inputRef={inputRef}
      />
    </div>
  );
}
