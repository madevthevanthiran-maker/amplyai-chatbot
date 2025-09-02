// components/ChatPanel.jsx
import React from "react";
import { loadMessages, saveMessages, clearMessages, newId } from "@/lib/persistedChat";

export default function ChatPanel({ tabId, systemPrompt, apiPath = "/api/chat", placeholder = "Type your message…" }) {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [lastUserMsg, setLastUserMsg] = React.useState(null);

  React.useEffect(() => { setMessages(loadMessages(tabId)); }, [tabId]);
  React.useEffect(() => { saveMessages(tabId, messages); }, [tabId, messages]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content) return;

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
      setMessages((curr) => [...curr, { id: newId(), role: "assistant", content: modelContent, ts: Date.now() }]);
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

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{label}</h2>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50">Clear</button>
          {error && <button onClick={retry} className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50">Retry</button>}
        </div>
      </div>

      <div className="rounded-2xl border p-3 max-h-[60vh] overflow-y-auto bg-white/70">
        {messages.filter(m => m.role !== "system").length === 0 ? (
          <div className="text-sm text-gray-500">Start a conversation. Your messages will persist on this tab.</div>
        ) : (
          messages.filter(m => m.role !== "system").map((m) => (
            <div key={m.id} className={`mb-2 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed
                ${m.role === "user" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && <div className="mt-2 text-sm text-gray-500 italic">…thinking</div>}
        {error && <div className="mt-2 text-sm text-red-600">⚠️ {error}</div>}
      </div>

      <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <button disabled={loading || !input.trim()} className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm disabled:opacity-50">
          Send
        </button>
      </form>

      <div className="text-xs text-gray-500">Conversations auto-save locally per tab.</div>
    </div>
  );
}
