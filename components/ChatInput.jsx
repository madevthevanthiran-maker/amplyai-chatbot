// components/ChatInput.jsx
import React, { useEffect, useRef } from "react";

export default function ChatInput({
  value,
  onChange,
  onSend,
  placeholder = "Ask anything… (Shift+Enter for newline, Enter to send)",
  disabled = false,
}) {
  const ref = useRef(null);

  // Auto-grow textarea up to CSS max-height
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) return; // allow newline
      e.preventDefault();
      if (!disabled && onSend) onSend();
    }
  };

  return (
    <div className="flex items-end gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 p-2">
      <textarea
        ref={ref}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[48px] max-h-60 w-full resize-y bg-transparent px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => !disabled && onSend?.()}
        disabled={disabled || !value?.trim()}
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-500"
        aria-label="Send"
        title="Send (Enter)"
      >
        Send
      </button>
    </div>
  );
}
