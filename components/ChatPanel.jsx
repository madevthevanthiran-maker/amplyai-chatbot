// components/ChatPanel.jsx
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPanel({ mode, messages, onSend }) {
  const [input, setInput] = useState("");
  const taRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for preset insertions
  useEffect(() => {
    const handler = (e) => setInput((prev) => (prev ? prev + "\n" : "") + e.detail);
    window.addEventListener("amplyai.insertPreset", handler);
    return () => window.removeEventListener("amplyai.insertPreset", handler);
  }, []);

  // Resize the textarea to fit content
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 240) + "px";
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        const text = input.trim();
        setInput("");
        onSend(text);
      }
      return;
    }
  };

  const handleClickSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    onSend(text);
  };

  return (
    <div className="w-full">
      <div className="h-[64vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        {messages.length === 0 ? (
          <div className="text-slate-400 text-sm">
            Ask anything. I can give structured answers with sources when useful.
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`mb-3 max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-100"
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea
          ref={taRef}
          className="no-scrollbar w-full resize-y rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-slate-500"
          placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <button
          onClick={handleClickSend}
          className="h-10 shrink-0 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500"
        >
          Send
        </button>
      </div>
    </div>
  );
}
