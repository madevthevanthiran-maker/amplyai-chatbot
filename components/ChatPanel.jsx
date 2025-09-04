import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * ChatPanel
 * - Drop-in chat UI for AmplyAI
 * - Streams if /api/chat returns a ReadableStream; otherwise handles JSON.
 *
 * Optional props:
 *   - initialMessages: [{role:"assistant"|"user", content:string}]
 *   - tabId: string (if your backend distinguishes tabs)
 *   - systemHint: string (placeholder hint in the input)
 */
export default function ChatPanel({
  initialMessages = [
    {
      role: "assistant",
      content: "Hello! How can I assist you today?",
    },
  ],
  tabId = "chat",
  systemHint = "Ask anything… (I can give structured answers and include sources when useful)",
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
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

    // Append user message
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

      // Handle non-OK
      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.error || `Request failed (${res.status})`);
      }

      // Try streaming first
      const reader = res.body?.getReader?.();
      if (reader) {
        let assistantContent = "";
        setMessages((m) => [...m, { role: "assistant", content: "" }]);

        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          assistantContent += decoder.decode(value, { stream: true });
          setMessages((m) => {
            const copy = m.slice();
            copy[copy.length - 1] = { role: "assistant", content: assistantContent };
            return copy;
          });
        }
      } else {
        // Fallback JSON (non-stream)
        const data = await res.json();
        const assistant = data?.message ?? data?.content ?? "";
        setMessages((m) => [...m, { role: "assistant", content: String(assistant) }]);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || "Something went wrong. Please try again.");
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

  return (
    <div className="flex h-full flex-col">
      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto rounded-xl bg-[#0E1625]/50 p-4 sm:p-6">
        {messages.map((m, idx) => (
          <MessageBubble key={idx} role={m.role} content={m.content} />
        ))}
        {isSending && (
          <div className="mt-2 text-sm text-slate-400">Thinking…</div>
        )}
        <div ref={endRef} />
      </div>

      {/* ERROR */}
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

      {/* INPUT */}
      <div className="mt-3 flex items-center gap-3">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={systemHint}
          className="min-h-[48px] w-full resize-none rounded-xl border border-white/10 bg-[#0C1220]/80 px-4 py-3 text-[15px] leading-[1.25rem] text-slate-100 outline-none placeholder:text-slate-500 focus:border-white/20"
        />
        <button
          disabled={!canSend}
          onClick={() => sendMessage(input)}
          className="rounded-xl bg-[#2D5BFF] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Send
        </button>
      </div>

      <p className="mt-2 select-none text-center text-xs text-slate-500">
        Shortcuts: <span className="opacity-80">/</span> focus ·{" "}
        <span className="opacity-80">⌘/Ctrl + Enter</span> send ·{" "}
        <span className="opacity-80">Esc</span> blur
      </p>
    </div>
  );
}

/* ---------- Helpers & subcomponents ---------- */

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function MessageBubble({ role, content }) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={`mb-3 flex ${
        isAssistant ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`max-w-[92%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed md:max-w-[80%] ${
          isAssistant
            ? "bg-[#0E1526] text-slate-100"
            : "bg-[#2D5BFF] text-white"
        }`}
      >
        {isAssistant ? (
          <div className="prose prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2 prose-li:my-1 prose-pre:my-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || ""}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}

        {/* Actions row (copy / thumbs) */}
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
          <button
            className="hover:text-slate-200"
            onClick={() => copyToClipboard(content)}
          >
            Copy
          </button>
          <span className="opacity-40">·</span>
          <button
            className="hover:text-slate-200"
            onClick={() => console.info("thumbs up")}
            title="Helpful"
          >
            👍
          </button>
          <button
            className="hover:text-slate-200"
            onClick={() => console.info("thumbs down")}
            title="Not helpful"
          >
            👎
          </button>
        </div>
      </div>
    </div>
  );
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text || "");
  } catch (e) {
    console.error("copy failed", e);
  }
}
