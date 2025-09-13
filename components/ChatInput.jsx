import { useEffect, useRef, useState } from "react";

/**
 * ChatInput (fixed)
 * - Enter to send; Shift+Enter for newline
 * - Disabled state respected
 * - Calls onSend(text) with trimmed value
 */
export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message... (e.g. “next wed 14:30 call with supplier”)',
  autoFocus = true,
}) {
  const [value, setValue] = useState("");
  const taRef = useRef(null);

  useEffect(() => {
    if (autoFocus && taRef.current) taRef.current.focus();
  }, [autoFocus]);

  const doSend = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend?.(text);
    setValue("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  return (
    <div className="w-full sticky bottom-0 left-0 right-0 bg-[#0b0f1a] border-t border-white/10 px-4 py-3">
      <div className="mx-auto max-w-3xl flex gap-3 items-end">
        <textarea
          ref={taRef}
          className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none text-white placeholder:text-white/40"
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={doSend}
          disabled={disabled}
          className="px-4 py-2 rounded-xl border border-indigo-500 bg-indigo-600 text-white disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}
