import { useEffect, useRef, useState } from "react";
import ChatInput from "./ChatInput";
import PresetBar from "./PresetBar";
import ConnectGoogleBanner from "./ConnectGoogleBanner";
import Toast from "./Toast";
import presets from "./presets";
import parseFocus from "@/utils/parseFocus";

/**
 * ChatPanel
 * ---------
 * - Separate threads & drafts per mode (persisted in localStorage)
 * - Presets prefill the input (editable)
 * - Adjustable textarea (resize + autosize)
 * - Inline "Connect Google" banner when not connected
 * - Calendar prompts go through calendar path (esp. Focus tab)
 * - Free/Busy conflict check before creating events
 * - Success toast with "Open in Calendar" link
 * - Defensive duplicate-killer for stray global tabs/presets
 */

const STORAGE_THREADS = "pp.threads.v1";
const STORAGE_DRAFTS = "pp.drafts.v1";
const STORAGE_MODE = "pp.selectedMode.v1";

const MODES = [
  ["general", "Chat (general)"],
  ["mailmate", "MailMate (email)"],
  ["hirehelper", "HireHelper (resume)"],
  ["planner", "Planner (study/work)"],
  ["focus", "Focus"],
];

const DISPLAY_TZ =
  typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC"
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

const defaultGreeting = [{ role: "assistant", content: "Hello! How can I assist you today?" }];

const emptyThreads = () => Object.fromEntries(MODES.map(([k]) => [k, defaultGreeting.slice()]));
const emptyDrafts = () => Object.fromEntries(MODES.map(([k]) => [k, ""]));

function suggestNextSlots(startISO, endISO, count = 3, stepMinutes = 30) {
  const out = [];
  let start = new Date(startISO);
  let end = new Date(endISO);
  for (let i = 0; i < count; i++) {
    start = new Date(start.getTime() + stepMinutes * 60_000);
    end = new Date(end.getTime() + stepMinutes * 60_000);
    out.push([start.toISOString(), end.toISOString()]);
  }
  return out;
}

export default function ChatPanel() {
  const rootRef = useRef(null);

  const [selectedMode, setSelectedMode] = useState(() => {
    if (typeof window === "undefined") return "general";
    return localStorage.getItem(STORAGE_MODE) || "general";
  });

  const [threads, setThreads] = useState(() => {
    if (typeof window === "undefined") return emptyThreads();
    try {
      const raw = localStorage.getItem(STORAGE_THREADS);
      const parsed = raw ? JSON.parse(raw) : null;
      const base = emptyThreads();
      return parsed ? { ...base, ...parsed } : base;
    } catch {
      return emptyThreads();
    }
  });

  const [drafts, setDrafts] = useState(() => {
    if (typeof window === "undefined") return emptyDrafts();
    try {
      const raw = localStorage.getItem(STORAGE_DRAFTS);
      const parsed = raw ? JSON.parse(raw) : null;
      const base = emptyDrafts();
      return parsed ? { ...base, ...parsed } : base;
    } catch {
      return emptyDrafts();
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_THREADS, JSON.stringify(threads)); } catch {}
  }, [threads]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_DRAFTS, JSON.stringify(drafts)); } catch {}
  }, [drafts]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_MODE, selectedMode); } catch {}
  }, [selectedMode]);

  const currentMessages = threads[selectedMode] || defaultGreeting;
  const currentDraft = drafts[selectedMode] || "";

  const [connected, setConnected] = useState(false);
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/google/status");
        const data = await res.json();
        if (data?.connected) {
          setConnected(true);
          setTokens(data.tokens ?? true);
        } else {
          setConnected(false);
          setTokens(null);
        }
      } catch {
        setConnected(false);
      }
    })();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof document === "undefined") return;

    const hideExternalUIs = () => {
      document.querySelectorAll(".preset-strip").forEach((el) => {
        if (!root.contains(el)) (el.closest("div") || el).style.display = "none";
      });
      const labels = MODES.map(([, label]) => label);
      const btns = Array.from(document.querySelectorAll("button"));
      const candidateRows = new Map();
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
        if (count >= 3) row.style.display = "none";
      });
    };

    hideExternalUIs();
    const mo = new MutationObserver(hideExternalUIs);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  const setDraft = (mode, text) => setDrafts((prev) => ({ ...prev, [mode]: text }));
  const pushMessage = (mode, msg) =>
    setThreads((prev) => {
      const arr = prev[mode] || [];
      return { ...prev, [mode]: [...arr, msg] };
    });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const inputRef = useRef(null);

  const handleSend = async (text) => {
    pushMessage(selectedMode, { role: "user", content: text });
    setDraft(selectedMode, "");
    setLoading(true);

    try {
      const isCalendarLike =
        selectedMode === "focus" ||
        /\b(block|calendar|schedule|meeting|mtg|event|call|appointment|appt)\b/i.test(text);

      if (isCalendarLike) {
        if (!connected) {
          pushMessage(selectedMode, {
            role: "assistant",
            content:
              "❌ Calendar not connected. Click **Connect Google** below to link your account, then try again.",
          });
          setLoading(false);
          return;
        }

        const parsed = parseFocus(text, new Date());
        if (!parsed || !parsed.startISO || !parsed.endISO) {
          pushMessage(selectedMode, {
            role: "assistant",
            content: "⚠️ Couldn’t parse into a date/time. Try being more specific.",
          });
          setLoading(false);
          return;
        }

        let conflict = false;
        try {
          const fbRes = await fetch("/api/google/calendar/freebusy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              timeMin: parsed.startISO,
              timeMax: parsed.endISO,
              timeZone: parsed.timezone || DISPLAY_TZ,
            }),
          });
          const fb = await fbRes.json();
          if (fbRes.ok && Array.isArray(fb?.busy) && fb.busy.length > 0) {
            conflict = true;
          }
        } catch {}

        if (conflict) {
          const suggestions = suggestNextSlots(parsed.startISO, parsed.endISO, 3, 30);
          const lines = suggestions
            .map(([s, e]) => `• ${fmtDT(s)} → ${fmtDT(e)} (${DISPLAY_TZ})`)
            .join("\n");
          pushMessage(selectedMode, {
            role: "assistant",
            content: `⚠️ You're busy during that time.\nHere are some alternatives:\n${lines}`,
          });
          setLoading(false);
          return;
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "calendar", message: text, tokens }),
        });
        const data = await res.json();

        if (!res.ok) {
          pushMessage(selectedMode, {
            role: "assistant",
            content: `❌ Calendar error: ${data.message || data.error || "Not connected"}`,
          });
        } else if (data?.parsed) {
          const { title, startISO, endISO, htmlLink } = data.parsed;
          pushMessage(selectedMode, {
            role: "assistant",
            content: `📅 **Created:** ${title}\n🕒 ${fmtDT(startISO)} → ${fmtDT(endISO)} (${DISPLAY_TZ})`,
          });
          if (htmlLink) {
            setToast({
              message: `Event “${title}” created successfully.`,
              link: { href: htmlLink, label: "Open in Calendar" },
            });
          }
        } else {
          pushMessage(selectedMode, {
            role: "assistant",
            content: "⚠️ I couldn't parse that into an event.",
          });
        }
        setLoading(false);
        return;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Request failed");
      pushMessage(selectedMode, { role: "assistant", content: data.reply || "(no reply)" });
    } catch (err) {
      console.error("[/api/chat] error", { text, err });
      pushMessage(selectedMode, { role: "assistant", content: `❌ ${err.message}` });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handlePresetClick = (text) => {
    const t = text ?? "";
    setDraft(selectedMode, t);
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

  const startConnect = () => {
    const returnTo = typeof window !== "undefined" ? window.location.pathname : "/chat";
    const url = `/api/google/oauth/start?returnTo=${encodeURIComponent(returnTo)}`;
    window.location.href = url;
  };

  return (
    <div ref={rootRef} className="flex min-h-[calc(100vh-64px)] flex-col bg-[#0b0f1a]">
      <div className="mx-auto max-w-3xl px-3 py-2 flex flex-wrap gap-2 text-sm">
        {MODES.map(([value, label]) => {
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

      <div className="mx-auto w-full max-w-3xl px-3">
        <PresetBar
          presets={presets[selectedMode] || []}
          selectedMode={selectedMode}
          onInsert={handlePresetClick}
        />
      </div>

      <div className="mx-auto w-full max-w-3xl px-3 md:px-4">
        <div className="space-y-3 pb-24">
          {(currentMessages || defaultGreeting).map((m, i) => (
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

          {!connected && (
            <ConnectGoogleBanner
              onConnect={startConnect}
              className="mt-2"
              message="Connect Google Calendar to create meetings and time blocks directly from the Focus tab or any calendar-like prompt."
            />
          )}
        </div>
      </div>

      <ChatInput
        value={currentDraft}
        onChange={(v) => setDraft(selectedMode, v)}
        onSend={handleSend}
        disabled={loading}
        inputRef={inputRef}
        minRows={1}
        maxRows={8}
        autosize
      />

      {toast && (
        <Toast
          message={toast.message}
          link={toast.link}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
