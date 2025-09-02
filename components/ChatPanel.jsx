// components/ChatPanel.jsx
import React from "react";
import { loadMessages, saveMessages, clearMessages, newId } from "@/lib/persistedChat";
import { track } from "@/lib/analytics";

export default function ChatPanel({
  tabId,
  systemPrompt,
  apiPath = "/api/chat",
  placeholder = "Ask anything…",
}) {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [lastUserMsg, setLastUserMsg] = React.useState(null);
  const [copiedId, setCopiedId] = React.useState(null);

  const inputRef = React.useRef(null);

  // Load & persist per-tab conversation
  React.useEffect(() => { setMessages(loadMessages(tabId)); }, [tabId]);
  React.useEffect(() => { saveMessages(tabId, messages); }, [tabId, messages]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const onKey = (e) => {
      const meta = e.ctrlKey || e.metaKey;

      // Focus with '/'
      if (e.key === "/" && !e.target.closest("input,textarea")) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      // Send with Cmd/Ctrl + Enter
      if (meta && e.key === "Enter") {
        e.preventDefault();
        if (!loading) send();
        return;
      }

      // Clear chat with Cmd/Ctrl + L
      if (meta && e.key.toLowerCase() === "l") {
        e.preventDefault();
        if (confirm("Clear this chat?")) reset();
        return;
      }

      // Blur with Esc
      if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading]);

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
    try { track("message_send", { tab: tabId }); } catch {}

    try {
      const resp = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          messages: bootstrap.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const msg = data?.error || `HTTP ${resp.status}`;
        throw new Error(msg);
      }

      const data = await resp.json();
      const modelContent =
        data?.content ??
        data?.choices?.[0]?.message?.content ??
        "Sorry, I didn’t catch that.";

      const assistantMsg = {
        id: newId(),
        role: "assistant",
        content: modelContent,
        ts: Date.now(),
      };
      setMessages((curr) => [...curr, assistantMsg]);
    } catch (e) {
      setError((e && e.message) || "Something went wrong. Please try again.");
      try { track("error", { tab: tabId, message: String(e?.message || e) }); } catch {}
    } finally {
      setLoading(false);
    }
  };

  const retry = () => lastUserMsg && send(lastUserMsg.content);

  const reset = () => {
    clearMessages(tabId);
    setMessages([]);
    setError(null);
    setLastUserMsg(null);
  };

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
    try { track("feedback_vote", { tab: tabId, vote: isUp ? "up" : "down" }); } catch {}
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Conversation */}
      <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-4 max-h-[60vh] overflow-y-auto">
        {messages.filter(m => m.role !== "system").length === 0 ? (
          <div className="text-sm text-gray-400">
            Hey! I’m your Progress Partner. What do you want to do today?
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Write a great email (MailMate)</li>
              <li>Build/refresh your resume (HireHelper)</li>
              <li>Plan study/work for two weeks (Planner)</li>
              <li>Or just ask anything in Chat (general)</li>
            </ul>
          </div>
        ) : (
          messages
            .filter((m) => m.role !== "system")
            .map((m) => (
              <div key={m.id} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-2 text-sm max-w-[80%] leading-relaxed shadow-sm
                    ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-100"}`}
                >
                  {m.content}
                  {m.role === "assistant" && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                      <button onClick={() => copyText(m.id, m.content)} className="hover:text-gray-200">
                        {copiedId === m.id ? "Copied!" : "Copy"}
                      </button>
                      <span>·</span>
                      <button onClick={() => handleFeedback(m.id, true)}>👍</button>
                      <button onClick={() => handleFeedback(m.id, false)}>👎</button>
                    </div>
                  )}
                </div>
              </div>
            ))
        )}

        {loading && <div className="text-sm text-gray-400 italic">…thinking</div>}

        {error && (
          <div className="mt-2 inline-block rounded-xl bg-red-900/30 text-red-300 text-sm px-3 py-2">
            ⚠️ {error}{" "}
            {lastUserMsg && (
              <button onClick={retry} className="underline">
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Input + actions */}
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 rounded-full border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-100
            placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-full border border-gray-700 text-sm text-gray-200 hover:bg-gray-800/70"
            title="Start a new chat"
          >
            New chat
          </button>

          <button
            disabled={loading || !input.trim()}
            className="px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      </form>

      {/* helper hint */}
      <div className="text-[11px] text-gray-500">
        Shortcuts: <span className="font-medium text-gray-300">/</span> focus ·{" "}
        <span className="font-medium text-gray-300">⌘/Ctrl + Enter</span> send ·{" "}
        <span className="font-medium text-gray-300">⌘/Ctrl + L</span> clear ·{" "}
        <span className="font-medium text-gray-300">Esc</span> blur
      </div>
    </div>
  );
}
