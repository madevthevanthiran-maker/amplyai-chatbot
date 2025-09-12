import { useEffect, useState } from "react";
import ChatInput from "./ChatInput";
import PresetBar from "./PresetBar";
import presets from "./presets";

/**
 * ChatPanel
 * - Keeps existing calendar routing + GPT fallback intact
 * - Loads tokens from /api/google/status
 * - Wires OG PresetBar (expects {presets, onInsert, selectedMode})
 * - Clicking a preset immediately sends it through the same pipeline
 */

const DISPLAY_TZ =
  process.env.NEXT_PUBLIC_USER_TZ && typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_USER_TZ
    : "Asia/Singapore";

function fmtDateTime(iso, locale = "en-SG", timeZone = DISPLAY_TZ) {
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
  const [tokens, setTokens] = useState(null);
  const [loading, setLoading] = useState(false);

  // Which preset group to show. You can set this from tabs elsewhere.
  const [selectedMode, setSelectedMode] = useState("general"); // "general" | "mailmate" | "hirehelper" | "planner" | "focus"

  // Load Google tokens on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/google/status");
        const data = await res.json();
        if (data.connected) setTokens(data.tokens);
      } catch (e) {
        console.error("[ChatPanel] failed to load tokens", e);
      }
    })();
  }, []);

  function addMessage(msg) {
    setMessages((prev) => [...prev, msg]);
  }

  async function handleSend(text) {
    addMessage({ role: "user", content: text });
    setLoading(true);

    try {
      // Detect calendar-like prompts (focus)
      const calendarLike =
        /\b(block|calendar|schedule|meeting|mtg|event|call|appointment|appt)\b/i.test(
          text
        ) ||
        // also route when using the "focus" preset group explicitly
        selectedMode === "focus";

      if (calendarLike) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "calendar", message: text, tokens }),
        });
        const data = await res.json();

        if (!res.ok) {
          addMessage({
            role: "assistant",
            content: `❌ Calendar error: ${data.message || data.error || "Not connected"}`,
          });
          setLoading(false);
          return;
        }

        if (data?.parsed) {
          const startStr = fmtDateTime(data.parsed.startISO);
          const endStr = fmtDateTime(data.parsed.endISO);
          addMessage({
            role: "assistant",
            content: `📅 **Created:** ${data.parsed.title}\n🕒 ${startStr} → ${endStr} (${DISPLAY_TZ})`,
          });
        } else {
          addMessage({
            role: "assistant",
            content: "⚠️ I couldn't parse that into an event.",
          });
        }
        setLoading(false);
        return;
      }

      // Default: GPT flow
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      addMessage({ role: "assistant", content: data.reply || "(no reply)" });
    } catch (err) {
      addMessage({ role: "assistant", content: `❌ ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-[#0b0f1a]">
      {/* Optional mode switcher (keep your own tabs if you have them) */}
      {/* Example:
      <div className="mx-auto max-w-3xl px-3 py-2 flex gap-2 text-sm">
        {["general","mailmate","hirehelper","planner","focus"].map(m => (
          <button
            key={m}
            onClick={() => setSelectedMode(m)}
            className={`px-3 py-1.5 rounded-full border ${selectedMode===m ? "bg-indigo-600 text-white border-indigo-500" : "bg-white/5 text-white/80 border-white/10"}`}
          >
            {m}
          </button>
        ))}
      </div>
      */}

      {/* Preset bar using your OG component (works via onInsert) */}
      <div className="mx-auto w-full max-w-3xl px-3">
        <PresetBar
          presets={presets[selectedMode] || []}
          selectedMode={selectedMode}
          onInsert={(prompt) => {
            if (prompt && typeof prompt === "string") {
              // Send via same pipeline as typing
              handleSend(prompt);
            }
          }}
          className="mb-1"
        />
      </div>

      {/* Conversation */}
      <div className="mx-auto w-full max-w-3xl px-3 md:px-4">
        <div className="space-y-3 pb-28">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`message-appear whitespace-pre-wrap leading-relaxed rounded-2xl px-4 py-3 ${
                m.role === "user"
                  ? "bg-indigo-600/20 text-indigo-100 border border-indigo-400/20 self-end"
                  : "bg-white/10 text-white border border-white/10 self-start"
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="text-sm text-white/60">Assistant is typing…</div>
          )}
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={loading}
        placeholder="Type a message… (e.g. “next wed 14:30 call with supplier”)"
      />
    </div>
  );
}
