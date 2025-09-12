import { useRef, useState } from "react";
import ChatBox from "@/components/ChatBox";
import PresetBar from "@/components/PresetBar";
import presets from "@/components/presets";

/**
 * Chat page (locked-in)
 * - Renders ONE PresetBar and wires it to ChatBox via refCallback.
 * - Uses your existing PresetBar API: { presets, onInsert, selectedMode }.
 * - Switch modes to change the preset set (general/mailmate/hirehelper/planner/focus).
 */
export default function ChatPage() {
  const [mode, setMode] = useState("general"); // "general" | "mailmate" | "hirehelper" | "planner" | "focus"
  const sendRef = useRef(null); // ChatBox will give us a function to send text

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      {/* Mode chips (reuse/replace with your existing tab header as you wish) */}
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

      {/* SINGLE preset bar at top — forwards clicks to ChatBox */}
      <div className="mx-auto w-full max-w-4xl px-4">
        <PresetBar
          presets={presets[mode] || []}
          selectedMode={mode}
          onInsert={(text) => {
            if (sendRef.current) sendRef.current(text);
          }}
        />
      </div>

      {/* ChatBox exposes its sender through refCallback */}
      <div className="mx-auto max-w-4xl px-4 pt-3 pb-8">
        <ChatBox
          refCallback={(fn) => {
            sendRef.current = fn; // programmatic sender
          }}
          header="General Chat"
        />
      </div>
    </div>
  );
}
