import { useState, useRef, useEffect } from "react";

/**
 * Controlled chat input.
 * - Never pre-fills from messages/errors.
 * - Disables browser autocomplete/spellcheck to avoid wavy red underlines.
 * - Calls onSend(text) and clears itself only after submit succeeds.
 */
export default function ChatInput({ onSend, disabled = false, placeholder = "Type a message..." }) {
  const [value, setValue] = useState("");
  const formRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Safety: never let any external HTML put content inside the input.
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
      // Only clear after the onSend promise resolves (prevents flashing if it errors)
      setValue("");
    } catch (err) {
      // Keep the text so user can edit/resend
      console.error("[ChatInput] onSend error:", err);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="p-3 flex gap-2 border-t bg-[#0b0f1a]">
      <input
        ref={inputRef}
        className="flex-1 border rounded px-3 py-2 bg-[#0e1526] text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-600"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        inputMode="text"
      />
      <button
        type="submit"
        className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
        disabled={disabled}
      >
        Send
      </button>
    </form>
  );
}
