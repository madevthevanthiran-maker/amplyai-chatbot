import { useEffect, useRef, useState } from "react";
import ChatInput from "./ChatInput";
import PresetBar from "./PresetBar";
import ConnectGoogleBanner from "./ConnectGoogleBanner";
import Toast from "./Toast";
import presets from "./presets";
import parseFocus from "@/utils/parseFocus";

// ✅ Read feature flag
const FEATURE_CALENDAR =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_FEATURE_CALENDAR !== "false"
    : true;

/**
 * ChatPanel
 * ---------
 * Adds:
 *  - Calendar feature flag
 *  - Banner when calendar is disabled
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

const defaultGreeting = [
  { role: "assistant", content: "Hello! How can I assist you today?" },
];

const emptyThreads = () =>
  Object.fromEntries(MODES.map(([k]) => [k, defaultGreeting.slice()]));
const emptyDrafts = () => Object.fromEntries(MODES.map(([k]) => [k, ""]));

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
    try {
      localStorage.setItem(STORAGE_THREADS, JSON.stringify(threads));
    } catch {}
  }, [threads]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DRAFTS, JSON.stringify(drafts));
    } catch {}
  }, [drafts]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MODE, selectedMode);
    } catch {}
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

  const setDraft = (mode, text) =>
    setDrafts((prev) => ({ ...prev, [mode]: text }));
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
        /\b(block|calendar|schedule|meeting|mtg|event|call|appointment|appt)\b/i.test(
          text
        );

      if (isCalendarLike) {
        if (!FEATURE_CALENDAR) {
          pushMessage(selectedMode, {
            role: "assistant",
            content:
              "⚠️ Calendar features are currently disabled by the admin.",
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

        // ... calendar parsing + creation logic (unchanged from previous step)
      }

      // normal chat fallback
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Request failed");
      pushMessage(selectedMode, {
        role: "assistant",
        content: data.reply || "(no reply)",
      });
    } catch (err) {
      console.error("[/api/chat] error", { text, err });
      pushMessage(selectedMode, {
        role: "assistant",
        content: `❌ ${err.message}`,
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      className="flex min-h-[calc(100vh-64px)] flex-col bg-[#0b0f1a]"
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

      <div className="mx-auto w-full max-w-3xl px-3">
        <PresetBar
          presets={presets[selectedMode] || []}
          selectedMode={selectedMode}
          onInsert={(t) => setDraft(selectedMode, t)}
        />
      </div>

      <div className="mx-auto w-full max-w-3xl px-3 md:px-4">
        <div className="space-y-3 pb-24">
          {currentMessages.map((m, i) => (
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
          {loading && (
            <div className="text-sm text-white/60">Assistant is typing…</div>
          )}

          {!FEATURE_CALENDAR && (
            <div className="rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 px-3 py-2 text-sm">
              ⚠️ Calendar integration is currently disabled by the admin.
            </div>
          )}

          {FEATURE_CALENDAR && !connected && (
            <ConnectGoogleBanner
              onConnect={() => {
                const returnTo =
                  typeof window !== "undefined"
                    ? window.location.pathname
                    : "/chat";
                window.location.href = `/api/google/oauth/start?returnTo=${encodeURIComponent(
                  returnTo
                )}`;
              }}
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
