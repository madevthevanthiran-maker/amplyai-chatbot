import { useEffect, useRef, useState } from "react";
import ChatInput from "./ChatInput";
import PresetBar from "./PresetBar";
import presets from "./presets";

/**
 * ChatPanel (single-stack with editable presets + duplicate killer 2.0)
 * -------------------------------------------------------------------
 * Owns:
 *  - Mode tabs
 *  - EXACTLY ONE PresetBar (wired to prefill input)
 *  - Messages list
 *  - Input (Enter-to-send, Shift+Enter newline)
 *
 * NEW:
 *  - Robust duplicate remover using MutationObserver.
 *    If any external layout renders an extra tab row or preset bar
 *    *before or after* this component mounts, we hide it safely by
 *    applying `style.display = 'none'` to the out-of-root nodes.
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
  const rootRef = useRef(null);

  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I assist you today?" },
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState("general");
  const [tokens, setTokens] = useState(null);

  // Controlled draft + ref so presets can prefill + focus cursor at end
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  // --- Duplicate killer (MutationObserver) ---
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof document === "undefined") return;

    const hideExternalUIs = () => {
      // Hide any preset strips NOT contained inside our root
      const strips = Array.from(document.querySelectorAll(".preset-strip"));
      strips.forEach((el) => {
        if (!root.contains(el)) {
          const row = el.closest("div");
          (row || el).style.display = "none";
          (row || el).dataset.ppHiddenByChat = "1";
        }
      });

      // Hide any top mode-tab rows NOT inside our root.
      const labels = [
        "Chat (general)",
        "MailMate (email)",
        "HireHelper (resume)",
        "Planner (study/work)",
        "Focus",
      ];
      const btns = Array.from(document.querySelectorAll("button"));
      const candidateRows = new Map(); // rowEl -> count
      btns.forEach((b) => {
        const t = (b.textContent || "").trim();
        if (labels.includes(t)) {
          const row = b.parentElement?.closest("div");
          if (row && !root.contains(row)) {
            candidateRows.set(row, (candidateRows.get(row) || 0) + 1);
          }
        }
      });
      candidateRows.forEach((count, row) => {
        if (count >= 3) {
          row.style.display = "none";
          row.dataset.ppHiddenByChat = "1";
        }
      });
    };

    // Run immediately
    hideExternalUIs();

    // Observe future DOM changes (e.g., layout renders after us)
    const mo = new MutationObserver(() => hideExternalUIs());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => mo.disconnect();
  }, []);

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
    setDraft(""); // clear input after capture
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
      if (inputRef.current) inputRef.current.focus();
    }
  };

  // Prefill input from preset, focus, caret at end
  const handlePresetClick = (text) => {
    const t = text ?? "";
    setDraft(t);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      try {
        const len = t.length;
        el.setSelectionRange?.(len, len);
      } catch {}
    });
  };

  return (
    <div ref={rootRef} className="flex min-h-[calc(100vh-64px)] flex-col bg-[#0b0f1a]">
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

      {/* Single preset bar — fills input (does not auto-send) */}
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

      {/* Controlled input: Enter-to-send, Shift+Enter newline */}
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
