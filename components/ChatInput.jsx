import { useState, useRef, useEffect } from "react";

/**
 * ChatInput (classic style)
 * - Controlled input (prevents error text leaking into field)
 * - No logic changes; purely visual polish
 */
export default function ChatInput({ onSend, disabled = false, placeholder = "Type a message..." }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setAttribute("autocomplete", "off");
      inputRef.current.setAttribute("autocorrect", "off");
      inputRef.current.setAttribute("autocapitalize", "off");
      inputRef.current.setAttribute("spellcheck", "false");
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    try {
      await onSend(text);
      setValue("");
    } catch (err) {
      // keep text so user can edit/resend
      console.error("[ChatInput] onSend error:", err);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-white/10 bg-[#0b0f1a]/90 backdrop-blur sticky bottom-0">
      <div className="mx-auto max-w-3xl px-3 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            className="flex-1 resize-none rounded-2xl bg-[#0e1526] text-white placeholder-white/50 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
          />
          <button
            type="submit"
            disabled={disabled}
            className="shrink-0 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 transition disabled:opacity-50"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );
}
