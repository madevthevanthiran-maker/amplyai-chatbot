import { useRef, useState } from "react";
import ChatBox from "@/components/ChatBox";
import PresetBar from "@/components/PresetBar";
import presets from "@/components/presets";

/**
 * Chat page (single source of truth)
 * - Renders ONE PresetBar and forwards clicks to ChatBox via refCallback.
 * - No duplicate bars; no hidden state.
 */
export default function ChatPage() {
  const [mode, setMode] = useState("general"); // "general" | "mailmate" | "hirehelper" | "planner" | "focus"
  const sendRef = useRef(null); // ChatBox exposes a function here

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <div className="mx-auto max-w-4xl px-4 pt-4 pb-2 flex flex-wrap gap-2 text-sm">
        {[
          ["general", "Chat (general)"],
          ["mailmate", "MailMate (email)"],
          ["hirehelper", "HireHelper (resume)"],
          ["planner", "Planner (study/work)"],
          ["focus", "Focus"],
        ].map(([value, label]) => {
          const active = mode === value;
          return (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`px-3 py-1.5 rounded-full border ${
                active
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* SINGLE preset bar */}
      <div className="mx-auto w-full max-w-4xl px-4">
        <PresetBar
          presets={presets[mode] || []}
          selectedMode={mode}
          onInsert={(text) => {
            // Fire preset text into ChatBox
            if (sendRef.current) sendRef.current(text);
          }}
        />
      </div>

      {/* ChatBox exposes its programmatic sender */}
      <div className="mx-auto max-w-4xl px-4 pt-3 pb-8">
        <ChatBox
          refCallback={(fn) => {
            sendRef.current = fn;
          }}
          header="General Chat"
        />
      </div>
    </div>
  );
}
