import { useEffect, useRef, useState } from "react";

export default function ChatPanel({ mode, messages, onSend, setMessages }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  // Listen for preset prompt insertion
  useEffect(() => {
    const handleInsert = (e) => {
      if (typeof e.detail !== "string") return;
      setInput((prev) => prev + e.detail);
      textareaRef.current?.focus();
    };
    window.addEventListener("amplyai.insertPreset", handleInsert);
    return () => window.removeEventListener("amplyai.insertPreset", handleInsert);
  }, []);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, messages: newMessages }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data?.text || "(No response)" },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${err.message || "Network error"}` },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-slate-900 rounded-lg p-4 shadow-md">
      <div className="space-y-4 overflow-y-auto max-h-[60vh]">
        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`font-bold ${msg.role === "user" ? "text-white" : "text-green-400"}`}>
              {msg.role === "user" ? "You" : "AmplyAI"}
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <textarea
          ref={textareaRef}
          rows={2}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}
