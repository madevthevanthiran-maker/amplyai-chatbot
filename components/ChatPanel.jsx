// /components/ChatPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { tryHandleFocusCommand } from "@/utils/focusClient";
import { downloadTextFile } from "@/lib/download";

const STORAGE_KEY_PREFIX = "amplyai_draft_v1:";

export default function ChatPanel({ mode, messages, onSend }) {
  const storageKey = useMemo(() => STORAGE_KEY_PREFIX + mode, [mode]);
  const [input, setInput] = useState("");
  const [ephemeralNotice, setEphemeralNotice] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { setInput(localStorage.getItem(storageKey) || ""); } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(storageKey, input); } catch {}
  }, [input, storageKey]);

  const taRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const handler = (e) => setInput((p) => (p ? p + "\n" : "") + e.detail);
    window.addEventListener("amplyai.insertPreset", handler);
    return () => window.removeEventListener("amplyai.insertPreset", handler);
  }, []);
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 240) + "px";
  }, [input]);

  const submit = async () => {
    const text = input.trim();
    if (!text) return;

    const focus = await tryHandleFocusCommand(text);
    if (focus.handled) {
      setEphemeralNotice(focus.message || "");
      if (focus.message) setTimeout(() => setEphemeralNotice(""), 4000);
      if (focus.ok) setInput("");
      try { localStorage.removeItem(storageKey); } catch {}
      return;
    }

    setInput("");
    onSend(text);
    try { localStorage.removeItem(storageKey); } catch {}
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const copyToClipboard = async (text) => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const el = document.createElement("textarea");
      el.value = text; document.body.appendChild(el); el.select();
      document.execCommand("copy"); el.remove();
    }
  };

  return (
    <div className="w-full">
      <div className="h-[64vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        {messages.length === 0 ? (
          <div className="text-slate-400 text-sm">
            Ask anything. Tip: type{" "}
            <code className="rounded bg-slate-800 px-1">
              block 2-4pm today for Deep Work
            </code>{" "}
            to create a calendar event.
          </div>
        ) : (
          messages.map((m, i) => {
            const isUser = m.role === "user";
            const bubbleClass = isUser ? "ml-auto bg-blue-600 text-white" : "bg-slate-800 text-slate-100";
            return (
              <div key={i} className="mb-3 flex flex-col">
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${bubbleClass}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
                {!isUser && (
                  <div className="mt-1 flex gap-2 pl-1 text-[11px] text-slate-400">
                    <button className="rounded border border-slate-700 bg-slate-900/50 px-2 py-0.5 hover:bg-slate-800"
                            onClick={() => copyToClipboard(m.content)}>Copy</button>
                    <button className="rounded border border-slate-700 bg-slate-900/50 px-2 py-0.5 hover:bg-slate-800"
                            onClick={() => downloadTextFile(`amplyai-${mode}-${new Date().toISOString().slice(0,19)}.txt`, m.content)}>
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

      <div className="mt-3 flex flex-col gap-2">
        {ephemeralNotice && <div className="text-sm text-slate-300">{ephemeralNotice}</div>}
        <div className="flex items-end gap-2">
          <textarea
            ref={taRef}
            className="no-scrollbar w-full resize-y rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-slate-500"
            placeholder="Type here…  (Enter to send, Shift+Enter for new line)"
            value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} rows={3}
          />
          <button onClick={submit} className="h-10 shrink-0 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
