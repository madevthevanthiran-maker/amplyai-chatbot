import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPanel({
  initialMessages = [
    { role: "assistant", content: "Hello! How can I assist you today?" },
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
        // Try to read json; if not, read text.
        let errDetail = "";
        try {
          const j = await res.json();
          errDetail = j?.error || JSON.stringify(j);
        } catch {
          errDetail = await res.text();
        }
        throw new Error(errDetail || `Request failed (${res.status})`);
      }

      // Insert placeholder assistant message
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      // We will accumulate the entire payload (works for stream or non-stream)
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
        // As a fallback (very rare in browsers)
        fullText = await res.text();
      }

      // Normalize the payload to just the assistant's content
      const assistantContent = extractAssistantContent(fullText);

      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: assistantContent };
        return copy;
      });
    } catch (e) {
      console.error(e);
      setError(e.message || "Something went wrong. Please try again.");
      // Remove the placeholder assistant message if we added it
      setMessages((m) => (m[m.length - 1]?.role === "assistant" && m[m.length - 1]?.content === ""
        ? m.slice(0, -1)
        : m));
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
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

/**
 * Accepts any payload form (streamed text, JSON string, plain string) and
 * returns just the assistant content to display.
 */
function extractAssistantContent(payload) {
  // If we already have a string, try to parse JSON; otherwise return as-is.
  let text = typeof payload === "string" ? payload.trim() : "";

  // Some backends send JSON; some send strings. Normalize:
  // 1) Try JSON.parse on the whole thing.
  // 2) If it parses and has .message.content or .content, use that.
  // 3) Otherwise, fallback to the raw text.

  try {
    const maybeObj = JSON.parse(text);
    if (maybeObj && typeof maybeObj === "object") {
      if (maybeObj?.message?.content) return String(maybeObj.message.content);
      if (maybeObj?.content) return String(maybeObj.content);
    }
  } catch {
    // Not JSON — that’s fine, we’ll use the text directly
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
