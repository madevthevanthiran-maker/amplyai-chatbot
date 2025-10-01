// /components/ChatPanel.jsx
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { MODE_LIST } from "@/lib/modes";
import PresetBar from "./PresetBar";

export default function ChatPanel({ mode, messages, onSend, setMessages }) {
  const [input, setInput] = useState("");
  const containerRef = useRef(null);

  // ✅ Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input, mode);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Preset Prompts */}
      <PresetBar presets={mode.presets || []} onInsert={(text) => setInput(text)} />

      {/* Message Display */}
      <div
        ref={containerRef}
        className="flex flex-col gap-3 p-3 rounded-lg bg-slate-900 text-slate-100 h-96 overflow-y-auto border border-slate-700"
      >
        {messages.map((msg, i) => (
          <div key={i} className="text-sm leading-relaxed">
            <strong
              className={`block mb-1 ${
                msg.role === "user" ? "text-blue-400" : "text-green-400"
              }`}
            >
              {msg.role === "user" ? "You" : "AmplyAI"}
            </strong>
            {/* ✅ Removed 'prose' (kept messages clean & compact) */}
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <p className="font-bold" {...props} />,
                h2: ({ node, ...props }) => <p className="font-semibold" {...props} />,
                strong: ({ node, ...props }) => <span className="font-semibold" {...props} />,
                p: ({ node, ...props }) => <p className="mb-1" {...props} />,
                li: ({ node, ...props }) => <li className="ml-4 list-disc" {...props} />,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <textarea
        className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        rows={2}
        placeholder="Type a message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {/* Send Button */}
      <button
        onClick={handleSend}
        className="rounded-lg bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 transition text-sm font-medium"
      >
        Send
      </button>
    </div>
  );
}
