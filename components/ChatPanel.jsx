// components/ChatPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { downloadTextFile } from "@/lib/download";

const STORAGE_KEY_PREFIX = "amplyai_draft_v1:";

export default function ChatPanel({ mode, messages, onSend }) {
  // --- Draft autosave per mode ---
  const storageKey = useMemo(() => STORAGE_KEY_PREFIX + mode, [mode]);
  const [input, setInput] = useState("");

  // load draft for active mode (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      setInput(raw || "");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // persist draft as user types
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, input);
    } catch {}
  }, [input, storageKey]);

  const taRef = useRef(null);
  const endRef = useRef(null);

  // scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // listen for preset insert events
  useEffect(() => {
    const handler = (e) => setInput((prev) => (prev ? prev + "\n" : "") + e.detail);
    window.addEventListener("amplyai.insertPreset", handler);
    return () => window.removeEventListener("amplyai.insertPreset", handler);
  }, []);

  // auto-resize textarea
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 240) + "px";
  }, [input]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    setInput(""); // clear UI quickly
    onSend(text);
    // clear draft for this mode after sending
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // util: copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback: create a hidden textarea
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
  };

  return (
    <div className="w-full">
      {/* Messages */}
      <div className="h-[64vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        {messages.length === 0 ? (
          <div className="text-slate-400 text-sm">
            Ask anything. I can give structured answers with sources when useful.
          </div>
        ) : (
          messages.map((m, i) => {
            const isUser = m.role === "user";
            const bubbleClass = isUser
              ? "ml-auto bg-blue-600 text-white"
              : "bg-slate-800 text-slate-100";

            return (
              <div key={i} className="mb-3 flex flex-col">
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${bubbleClass}`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: (props) => (
                        <a
                          {...props}
                          className="underline decoration-slate-400 hover:decoration-slate-200"
                          target="_blank"
                          rel="noreferrer"
                        />
                      ),
                      code: ({ inline, className, children, ...props }) =>
                        inline ? (
                          <code className="rounded bg-slate-900/60 px-1 py-0.5">{children}</code>
                        ) : (
                          <pre className="overflow-auto rounded-lg bg-slate-900/70 p-3">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ),
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>

                {/* Action bar for assistant messages */}
                {!isUser && (
                  <div className="mt-1 flex gap-2 pl-1 text-[11px] text-slate-400">
                    <button
                      className="rounded border border-slate-700 bg-slate-900/50 px-2 py-0.5 hover:bg-slate-800"
                      onClick={() => copyToClipboard(m.content)}
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                    <button
                      className="rounded border border-slate-700 bg-slate-900/50 px-2 py-0.5 hover:bg-slate-800"
                      onClick={() =>
                        downloadTextFile(
                          `amplyai-${mode}-${new Date().toISOString().slice(0, 19)}.txt`,
                          m.content
                        )
                      }
                      title="Download as .txt"
                    >
                      Download
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex items-end gap-2">
        <textarea
          ref={taRef}
          className="no-scrollbar w-full resize-y rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-slate-500"
          placeholder="Type here…  (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={3}
        />
        <button
          onClick={submit}
          className="h-10 shrink-0 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500"
        >
          Send
        </button>
      </div>
    </div>
  );
}
