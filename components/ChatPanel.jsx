// components/ChatPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PresetBar from "./PresetBar";
import { MODES } from "@/lib/modes";

const MIN_H = 48;   // px
const MAX_H = 240;  // px

export default function ChatPanel({
  activeMode = "general",
  onSend,            // (text, mode) => void
  messages = [],     // array of { role: "user"|"assistant", content: string }
  placeholder,
}) {
  const mode = MODES[activeMode] ?? MODES.general;

  // per-mode height memory
  const lsKey = `inputH:${activeMode}`;
  const [input, setInput] = useState("");
  const [height, setHeight] = useState(
    () => Number(localStorage.getItem(lsKey)) || MIN_H
  );

  const taRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    autoGrow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(lsKey, String(height));
  }, [height, lsKey]);

  const autoGrow = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const next = Math.min(Math.max(ta.scrollHeight, MIN_H), MAX_H);
    ta.style.height = `${next}px`;
    setHeight(next);
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    autoGrow();
  };

  // Enter = send ; Shift+Enter = newline
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    onSend?.(text, activeMode);
    setInput("");
    requestAnimationFrame(() => {
      autoGrow();
      taRef.current?.focus();
    });
  };

  const insertPreset = (text) => {
    setInput((prev) => (prev ? `${prev}\n\n${text}` : text));
    requestAnimationFrame(autoGrow);
    taRef.current?.focus();
  };

  const showTemplateHint = useMemo(
    () => Boolean(mode?.template && !input?.trim()),
    [mode?.template, input]
  );

  return (
    <div className="flex h-full w-full flex-col">
      {/* Transcript */}
      <div
        ref={boxRef}
        className="flex-1 overflow-y-auto rounded-xl bg-slate-900/40 p-4 ring-1 ring-slate-800"
      >
        {messages?.length === 0 && (
          <div className="mb-4 text-sm text-slate-400">
            {mode?.description ?? "Ask anything."}
          </div>
        )}

        <div className="space-y-3">
          {messages?.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div key={i} className={`flex ${isUser ? "justify-end" : ""}`}>
                <div
                  className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-[15px] leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-100 ring-1 ring-slate-700"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preset buttons */}
      <PresetBar presets={mode?.presets} onInsert={insertPreset} />

      {/* Input row */}
      <div className="mt-1 flex items-end gap-2">
        <div className="relative flex-1">
          {showTemplateHint && (
            <div className="pointer-events-none absolute inset-0 select-none whitespace-pre-wrap rounded-lg bg-transparent p-3 text-[13px] leading-6 text-slate-500">
              {mode.template}
            </div>
          )}

          <textarea
            ref={taRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              placeholder ??
              "Type your message…  (Enter = send, Shift+Enter = new line)"
            }
            className={`h-[${height}px] max-h-[240px] min-h-[48px] w-full resize-y rounded-lg border border-slate-700 bg-slate-900/80 p-3 pr-12 text-[15px] leading-6 text-slate-100 outline-none ring-1 ring-transparent focus:ring-blue-500`}
            style={{ height }}
          />
          <div className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-slate-500">
            ↵ to send · ⇧↵ newline
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          className="h-[40px] shrink-0 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500"
        >
          Send
        </button>
      </div>
    </div>
  );
}
