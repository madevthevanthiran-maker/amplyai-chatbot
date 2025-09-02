// components/ChatPanel.jsx
import React from "react";
import { loadMessages, saveMessages, clearMessages, newId } from "@/lib/persistedChat";

export default function ChatPanel({
  tabId,
  systemPrompt,
  apiPath = "/api/chat",
  placeholder = "Type your message…",
}) {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [lastUserMsg, setLastUserMsg] = React.useState(null);
  const [copiedId, setCopiedId] = React.useState(null); // show "Copied!" per message briefly

  React.useEffect(() => { setMessages(loadMessages(tabId)); }, [tabId]);
  React.useEffect(() => { saveMessages(tabId, messages); }, [tabId, messages]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setError(null);
    setLoading(true);

    const userMsg = { id: newId(), role: "user", content, ts: Date.now() };
    const withUser = [...messages, userMsg];

    const bootstrap =
      messages.length === 0 && systemPrompt
        ? [{ id: newId(), role: "system", content: systemPrompt, ts: Date.now() }, userMsg]
        : withUser;

    setMessages(withUser);
    setLastUserMsg(userMsg);
    setInput("");

    try {
      const resp = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          messages: bootstrap.map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const modelContent =
        data?.content ?? data?.choices?.[0]?.message?.content ?? "Sorry, I didn’t catch that.";
      const assistantMsg = { id: newId(), role: "assistant", content: modelContent, ts: Date.now() };
      setMessages((curr) => [...curr, assistantMsg]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const retry = () => lastUserMsg && send(lastUserMsg.content);
  const reset = () => { clearMessages(tabId); setMessages([]); setError(null); setLastUserMsg(null); };

  const label =
    tabId === "hirehelper" ? "HireHelper" :
    tabId === "mailmate" ? "MailMate" :
    tabId === "planner" ? "Planner" : "Chat";

  const copyText = async (id, text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta);
        ta.select(); document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {}
  };

  const handleFeedback = (id, isUp) => {
    // Wire this to analytics later
    console.log("feedback", { tabId, messageId: id, vote: isUp ? "up" : "down" });
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
      {/* Header with quick actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{label}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
            title="Clear conversation"
          >
            Clear
          </button>
          {error && (
            <button
              onClick={retry}
              className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
              title="Retry last message"
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="rounded-2xl border p-3 max-h-[60vh] overflow-y-auto bg-white/70">
        {messages.filter(m => m.role !== "system").length === 0 ? (
          <div className="text-sm text-gray-500">
            Start a conversation. Your messages will persist on this tab.
          </div>
        ) : (
          messages
            .filter(m => m.role !== "system")
            .map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`mb-3 ${isUser ? "text-right" : "text-left"}`}>
                  <div
                    className={`relative inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed align-top
                      ${isUser ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}
                  >
                    {m.content}
                    {/* Assistant controls */}
                    {!isUser && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <button
                          onClick={() => copyText(m.id, m.content)}
                          className="underline hover:no-underline"
                          title="Copy"
                        >
                          {copiedId === m.id ? "Copied!" : "Copy"}
                        </button>
                        <span>·</span>
                        <button onClick={() => handleFeedback(m.id, true)} title="Helpful">👍</button>
                        <button onClick={() => handleFeedback(m.id, false)} title="Not helpful">👎</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="mb-2 text-left">
            <div className="inline-block max-w-[70%] rounded-2xl px-3 py-2 text-sm bg-gray-100 text-gray-600">
              <span className="typing">
                <span className="dot">•</span>
                <span className="dot">•</span>
                <span className="dot">•</span>
              </span>
            </div>
          </div>
        )}

        {/* Error bubble */}
        {error && (
          <div className="mt-2 inline-block rounded-xl bg-red-50 text-red-700 text-sm px-3 py-2">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-100 disabled:text-gray-500"
        />
        <button
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </form>

      <div className="text-xs text-gray-500">
        Conversations auto-save locally per tab. We’ll wire feedback + analytics next.
      </div>

      {/* Tiny CSS for animated dots */}
      <style jsx>{`
        .typing .dot {
          display: inline-block;
          margin-right: 2px;
          animation: blink 1.2s infinite ease-in-out;
        }
        .typing .dot:nth-child(2) { animation-delay: 0.15s; }
        .typing .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-1px); }
        }
      `}</style>
    </div>
  );
}
