"use client";

import { useEffect, useState } from "react";
import { MODE_LIST, PRESETS } from "@/lib/modes";

export default function ChatPanel({ onSend }) {
  const [mode, setMode] = useState("general");
  const [input, setInput] = useState("");
  const [showPresets, setShowPresets] = useState(true);

  const handleSend = () => {
    if (input.trim() !== "") {
      onSend({ role: "user", content: input });
      setInput("");
    }
  };

  const presets = PRESETS[mode] || [];

  useEffect(() => {
    // If mode changes, reset input and show presets again
    setInput("");
    setShowPresets(true);
  }, [mode]);

  return (
    <div className="flex flex-col h-full">
      {/* Mode Tabs */}
      <div className="flex gap-2 flex-wrap mb-2">
        {MODE_LIST.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`px-3 py-1 rounded-full text-sm ${
              mode === id
                ? "bg-white text-black font-semibold"
                : "bg-gray-800 text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Preset Buttons */}
      {showPresets && (
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <button
            className="px-2 py-1 text-sm text-gray-300"
            onClick={() => setShowPresets(false)}
          >
            ←
          </button>
          {presets.map((preset, i) => (
            <button
              key={i}
              className="bg-gray-700 text-gray-100 px-3 py-1 rounded-full text-sm"
              onClick={() => setInput(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      )}

      {/* Input and Send */}
      <div className="mt-auto">
        <textarea
          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 resize-none h-24"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
