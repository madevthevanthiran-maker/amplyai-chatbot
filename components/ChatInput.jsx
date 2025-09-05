// components/ChatInput.jsx
import React, { useEffect, useRef, useState } from "react";

export default function ChatInput({
  placeholder = "Ask anything… (Enter to send, Shift+Enter for new line)",
  onSend,
  minRows = 1,
  maxRows = 12,
}) {
  const [value, setValue] = useState("");
  const ref = useRef(null);

  // auto-grow between minRows and maxRows
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = parseInt(window.getComputedStyle(el).lineHeight, 10) || 20;
    const rows = Math.min(maxRows, Math.max(minRows, Math.ceil(el.scrollHeight / lineHeight)));
    el.style.height = `${rows * lineHeight}px`;
  }, [value, minRows, maxRows]);

  const send = () => {
    const text = value.trim();
    if (!text) return;
    onSend?.(text);
    setValue("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex items-end gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2">
      <textarea
        ref={ref}
        className="min-h-[36px] w-full resize-none bg-transparent px-2 py-2 outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        rows={minRows}
      />
      <button
        type="button"
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
        onClick={send}
      >
        Send
      </button>
    </div>
  );
}
