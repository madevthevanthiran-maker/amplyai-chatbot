// components/ChatPanel.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QuickActions from "@/components/QuickActions";
import { MODES } from "@/lib/modes";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const LS_KEY = "amplyai.conversations.v2";

function loadAll() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}
function saveAll(all) {
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}

export default function ChatPanel() {
  const [mode, setMode] = useState(MODES.general.id);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // ---------- helpers ----------
  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const autosizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";                 // reset first
    const max = 240;                         // cap (px) ~ 6–7 lines
    const next = Math.min(el.scrollHeight, max);
    el.style.height = Math.max(next, 64) + "px"; // min ~64px
  };

  useEffect(scrollToBottom, [messages, isSending]);
  useEffect(autosizeTextarea, [input]);

  // ---------- per-mode persistence ----------
  useEffect(() => {
    const all = loadAll();
    setMessages(all[mode]?.messages || []);
    if ((!all[mode] || !all[mode].messages?.length) && MODES[mode].template) {
      setInput(MODES[mode].template);
    } else {
      setInput("");
    }
    // ensure textarea adjusts after switching
    setTimeout(autosizeTextarea, 0);
  }, [mode]);

  const persist = useCallback((nextMsgs) => {
    const all = loadAll();
    all[mode] = { messages: nextMsgs };
    saveAll(all);
  }, [mode]);

  const onPickMode = (m) => setMode(m.id);

  // ---------- send / stream ----------
  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    persist(next);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat?stream=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, messages: next }),
      });

      if (!res.ok || !res.body) {
        const fallback = { role: "assistant", content: "Sorry, something went wrong. Please try again." };
        const next2 = [...next, fallback];
        setMessages(next2); persist(next2);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let assistant = { role: "assistant", content: "" };
      let appended = false;

      const pushChunk = (chunk) => {
        assistant.content += chunk;
        if (!appended) {
          appended = true;
          setMessages((cur) => { const nx = [...cur, assistant]; persist(nx); return nx; });
        } else {
          setMessages((cur) => { const nx = [...cur]; nx[nx.length - 1] = { ...assistant }; persist(nx); return nx; });
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) pushChunk(chunk);
      }
    } catch {
      const next2 = [...messages, { role: "assistant", content: "Network error. Please try again." }];
      setMessages(next2); persist(next2);
    } finally {
      setIsSending(false);
      scrollToBottom();
      setTimeout(autosizeTextarea, 0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e) => {
    // ENTER = send, SHIFT+ENTER = newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const active = MODES[mode];

  return (
    <div className="flex flex-col h-full">
      {/* Mode chips */}
      <QuickActions activeMode={mode} onPick={onPickMode} />
      <div className="text-xs text-slate-400 mb-2">{active.description}</div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-lg bg-slate-900/30 p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`${m.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-100"
              } max-w-[80%] rounded-xl px-4 py-3 text-[15px] leading-6`}>
              {m.role === "assistant" ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              ) : (
                <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={3}                                            // starts taller
          placeholder="Shift+Enter for a new line • Enter to send"
          className="flex-1 rounded-lg bg-slate-900/60 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          style={{ minHeight: 64, lineHeight: "1.45" }}
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-60"
        >
          {isSending ? "Sending…" : "Send"}
        </button>
      </form>

      {active.template && !messages.length && (
        <div className="mt-2 text-xs text-slate-400">
          Tip: This mode has a template. We prefilled your input — edit it and hit <kbd>Enter</kbd>.
        </div>
      )}
    </div>
  );
}
