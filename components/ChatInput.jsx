import { useEffect, useRef } from "react";

/**
 * ChatInput (controlled + adjustable)
 * -----------------------------------
 * - Controlled by parent via `value` / `onChange`
 * - Enter to send; Shift+Enter inserts newline
 * - Auto-grows between minRows..maxRows; also user-resizable (vertical)
 * - Parent can pass `inputRef` (to focus or set caret)
 */
export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Type a message... (e.g. “next wed 14:30 call with supplier”)',
  autoFocus = true,
  inputRef,      // optional external ref to the textarea
  minRows = 1,
  maxRows = 8,
  autosize = true,
}) {
  const innerRef = useRef(null);
  const taRef = inputRef || innerRef;

  // focus on mount
  useEffect(() => {
    if (autoFocus && taRef.current) taRef.current.focus();
  }, [autoFocus, taRef]);

  // autosize on value change
  useEffect(() => {
    if (!autosize || !taRef.current) return;
    const el = taRef.current;
    const lineHeight = getLineHeight(el) || 20;
    const minH = lineHeight * minRows;
    const maxH = lineHeight * maxRows;
    el.style.height = "auto";
    el.style.height = Math.min(maxH, Math.max(minH, el.scrollHeight)) + "px";
  }, [value, autosize, minRows, maxRows, taRef]);

  const doSend = () => {
    const text = (value || "").trim();
    if (!text || disabled) return;
    onSend?.(text);
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
          className="flex-1 resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none text-white placeholder:text-white/40"
          rows={minRows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
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

// util: compute numeric line-height
function getLineHeight(el) {
  const cs = window.getComputedStyle(el);
  const lh = cs.lineHeight;
  if (!lh || lh === "normal") return Math.round(parseFloat(cs.fontSize) * 1.4);
  return parseFloat(lh);
}
