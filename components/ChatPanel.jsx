import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { loadChat, saveChat, clearChat } from "@/utils/chatStorage";

export default function ChatPanel({
  initialMessages = [
    { role: "assistant", content: "Hello! How can I assist you today?" },
  ],
  tabId = "chat",
  systemHint = "Ask anything… (I can give structured answers and include sources when useful)",
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [initialized, setInitialized] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const saveTimer = useRef(null);

  // Load saved chat for this tab on mount
  useEffect(() => {
    const saved = loadChat(tabId);
    if (saved && Array.isArray(saved) && saved.length) {
      setMessages(saved);
    } else {
      setMessages(initialMessages);
    }
    setInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId]);

  // Persist on every change (debounced a bit)
  useEffect(() => {
    if (!initialized) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveChat(tabId, messages);
    }, 250);
    return () => clearTimeout(saveTimer.current);
  }, [messages, tabId, initialized]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isSending,
    [input, isSending]
  );

  async function sendMessage(text) {
    if (!text.trim()) return;
    setError("");
    setIsSending(true);

    const userMsg = { role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabId,
          messages: [...messages, userMsg],
        }),
      });

      if (!res.ok) {
        let detail = "";
        try {
          const j = await res.json();
          detail = j?.error || JSON.stringify(j);
        } catch {
          detail = await res.text();
        }
        throw new Error(detail || `Request failed (${res.status})`);
      }

      // placeholder assistant bubble
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      // read stream or full body
      const reader = res.body?.getReader?.();
      let fullText = "";

      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
        }
      } else {
        fullText = await res.text();
      }

      const assistantContent = extractAssistantContent(fullText);

      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: assistantContent };
        return copy;
      });
    } catch (e) {
      console.error(e);
      setError(e.message || "Something went wrong. Please try again.");
      setMessages((m) =>
        m[m.length - 1]?.role === "assistant" && m[m.length - 1]?.content === ""
          ? m.slice(0, -1)
          : m
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) sendMessage(input);
    }
  }

  function newChat() {
    clearChat(tabId);
    setMessages(initialMessages);
    setInput("");
    setError("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto rounded-xl bg-[#0E1625]/50 p-4 sm:p-6">
        {messages.map((m, idx) => (
          <MessageBubble key={idx} role={m.role} content={m.content} />
        ))}
        {isSending && (
          <div className="mt-2 text-sm text-slate-400">Thinking…</div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          ⚠ {error}{" "}
          <button
            onClick={() => setError("")}
            className="ml-2 underline decoration-dotted hover:text-amber-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={systemHint}
          className="min-h-[48px] w-full resize-none rounded-xl border border-white/10 bg-[#0C1220]/80 px-4 py-3 text-[15px] text-slate-100 outline-none placeholder:text-slate-500 focus:border-white/20"
        />
        <button
          disabled={!canSend}
          onClick={() => sendMessage(input)}
          className="rounded-xl bg-[#2D5BFF] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Send
        </button>
        <button
          onClick={newChat}
          className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5"
          title="Start a fresh conversation in this tab"
        >
          New chat
        </button>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
function extractAssistantContent(payload) {
  let text = typeof payload === "string" ? payload.trim() : "";

  try {
    const maybe = JSON.parse(text);
    if (maybe && typeof maybe === "object") {
      if (maybe?.message?.content) return String(maybe.message.content);
      if (maybe?.content) return String(maybe.content);
    }
  } catch {
    // not JSON; use as-is
  }
  return text;
}

function MessageBubble({ role, content }) {
  const isAssistant = role === "assistant";
  return (
    <div className={`mb-3 flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed md:max-w-[80%] ${
          isAssistant ? "bg-[#0E1526] text-slate-100" : "bg-[#2D5BFF] text-white"
        }`}
      >
        {isAssistant ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || ""}
          </ReactMarkdown>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  );
}
