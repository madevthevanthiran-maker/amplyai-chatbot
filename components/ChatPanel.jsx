// components/ChatPanel.jsx
import React from "react";
import { saveMessages, loadMessages, clearMessages } from "@/lib/persistedChat";

export default function ChatPanel({ tabId, systemPrompt, placeholder = "Ask anything…" }) {
  const [messages, setMessages] = React.useState(() => {
    const initial = loadMessages(tabId);
    if (initial.length === 0) {
      return [{ role: "assistant", content: "Hello! How can I assist you today?" }];
    }
    return initial;
  });
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState("");

  // Persist thread
  React.useEffect(() => {
    saveMessages(tabId, messages);
  }, [tabId, messages]);

  const onNewChat = () => {
    clearMessages(tabId);
    setMessages([{ role: "assistant", content: "New chat — how can I help?" }]);
    setInput("");
    setError("");
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    setError("");

    const userMsg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          messages: next,
          stream: false,
        }),
      });

      if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        throw new Error(info?.details || `Request failed: ${res.status}`);
      }

      const data = await res.json();
      const assistantText = (data?.message?.content ?? data?.content ?? "").toString();
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I didn’t catch that." },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Enter to send, Shift+Enter for newline
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="h-[60vh] md:h-[62vh] overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
        </div>

        <div className="border-t border-gray-800 p-3 md:p-4">
          {error && (
            <div className="mb-3 text-sm text-amber-300">
              ⚠ {error}{" "}
              <button className="underline" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          )}

          <div className="flex gap-2 items-start">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              className="flex-1 rounded-xl bg-gray-800 border border-gray-700 px-4 py-3 text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              placeholder={placeholder}
            />
            <button
              disabled={sending}
              onClick={send}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send"}
            </button>
            <button
              onClick={onNewChat}
              className="px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700"
              title="Clear thread"
            >
              New chat
            </button>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            Shortcuts: <span className="text-gray-300">Enter</span> send ·{" "}
            <span className="text-gray-300">Shift+Enter</span> newline ·{" "}
            <span className="text-gray-300">/</span> focus
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ role, content }) {
  const mine = role === "user";
  return (
    <div
      className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
        mine
          ? "ml-auto bg-blue-600 text-white"
          : "mr-auto bg-gray-800 text-gray-100 border border-gray-700"
      }`}
    >
      {/* Preserve email drafts & structured answers */}
      <div className="whitespace-pre-wrap">{content}</div>
      {!mine && (
        <div className="mt-2 text-xs opacity-70 flex items-center gap-2">
          <span>Copy</span> · <span>👍</span> <span>👎</span>
        </div>
      )}
    </div>
  );
}
