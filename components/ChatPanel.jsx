// components/ChatPanel.jsx

import { useChatContext } from "@/context/ChatContext";
import { useState } from "react";

export default function ChatPanel() {
  const {
    selectedMode,
    setSelectedMode,
    presets,
    modeList
  } = useChatContext();

  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: input }] }),
      });
      const data = await res.json();
      console.log("Response:", data);
    } catch (err) {
      console.error("Chat error:", err);
    }
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Modes */}
      <div className="flex gap-2 flex-wrap p-2">
        {modeList.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            className={`px-3 py-1 rounded-full ${selectedMode === mode.id ? "bg-white text-black" : "bg-gray-800 text-white"}`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Presets */}
      <div className="flex gap-2 flex-wrap p-2">
        {presets.map((preset, i) => (
          <button
            key={i}
            onClick={() => setInput(preset.text)}
            className="bg-gray-700 text-white px-3 py-1 rounded-full"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 mt-auto">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          className="w-full p-2 bg-gray-800 text-white rounded"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
