import { useState, useEffect, useRef } from "react";

export default function ChatPanel({ tabId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    // scroll to bottom when messages update
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const payload = {
        messages: [...messages, userMsg],
        tabId, // <-- this tells backend which mode we're in
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("API request failed");
      }

      const data = await res.json();
      const assistantMsg = { role: "assistant", content: data.content || "" };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "⚠️ Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg max-w-xl ${
              m.role === "user"
                ? "bg-blue-600 text-white ml-auto"
                : "bg-gray-800 text-gray-100"
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input box */}
      <div className="border-t border-gray-700 p-3 flex items-center">
        <textarea
          className="flex-1 resize-none rounded-md bg-gray-900 text-gray-100 p-2 focus:outline-none"
          rows={1}
          value={input}
          placeholder="Ask anything..."
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="ml-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white disabled:opacity-50"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
