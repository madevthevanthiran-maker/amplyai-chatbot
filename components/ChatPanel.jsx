import { useEffect, useRef, useState } from "react";
import ChatInput from "./ChatInput";
import PresetBar from "./PresetBar";
import ConnectGoogleBanner from "./ConnectGoogleBanner";
import Toast from "./Toast";
import presets from "./presets";
import parseFocus from "@/utils/parseFocus";

// ✅ Feature flag (kill switch)
const FEATURE_CALENDAR =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_FEATURE_CALENDAR !== "false"
    : true;

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

const defaultGreeting = [
  { role: "assistant", content: "Hello! How can I assist you today?" },
];

const emptyThreads = () =>
  Object.fromEntries(MODES.map(([k]) => [k, defaultGreeting.slice()]));
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
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        if (!FEATURE_CALENDAR) {
          pushMessage(selectedMode, {
            role: "assistant",
            content: "⚠️ Calendar features are currently disabled by the admin.",
          });
          setLoading(false);
          return;
        }

        if (!connected) {
          pushMessage(selectedMode, {
            role: "assistant",
            content:
              "❌ Calendar not connected. Click **Connect Google** below to link your account, then try again.",
          });
          setLoading(false);
          return;
        }

        // ✅ FIXED LINE: Pass timezone inside options object
        const parsed = parseFocus(text, new Date(), { timezone: DISPLAY_TZ });

        if (!parsed || !parsed.startISO || !parsed.endISO) {
          pushMessage(selectedMode, {
            role: "assistant",
            content: "⚠️ Couldn’t parse into a date/time. Try being more specific.",
          });
          setLoading(false);
          return;
        }

        // Free/Busy conflict check
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

      // Normal chat
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
      {/* Sticky top bar */}
      <div
        className={[
          "sticky top-0 z-40",
          "bg-[#0b0f1a]/90 backdrop-blur-md border-b border-white/10",
          scrolled ? "shadow-[0_6px_16px_rgba(0,0,0,0.35)]" : "shadow-none",
        ].join(" ")}
      >
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
        <div className="mx-auto w-full max-w-3xl px-3 pb-2">
          <PresetBar
            presets={presets[selectedMode] || []}
            selectedMode={selectedMode}
            onInsert={handlePresetClick}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="mx-auto w-full max-w-3xl px-3 md:px-4">
        <div className="space-y-3 pb-24 pt-3">
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

          {!FEATURE_CALENDAR && (
            <div className="rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 px-3 py-2 text-sm">
              ⚠️ Calendar integration is currently disabled by the admin.
            </div>
          )}

          {FEATURE_CALENDAR && !connected && (
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
        <Toast message={toast.message} link={toast.link} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
