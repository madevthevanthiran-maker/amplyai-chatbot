// components/ChatBox.jsx
import { useEffect, useRef, useState } from "react";
import { askGeneral } from "@/utils/chatClient";

export default function ChatBox({
  storageKey = "pp.general",
  placeholder = "Ask me anything…",
  header = "General Chat",
  system = "You are Progress Partner, a helpful, concise assistant. Answer plainly and helpfully.",
}) {
  const [messages, setMessages] = useState([
    { role: "system", content: system },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function send() {
    const content = input.trim();
    if (!content) return;
    setInput("");

    const userMsg = { role: "user", content };
    const convo = messages.filter((m) => m.role !== "system");
    const next = [...convo, userMsg];

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const reply = await askGeneral(next, system);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry — ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="pp-chat-wrap">
      <div className="pp-chat-header">{header}</div>

      <div className="pp-chat-scroller" ref={scrollerRef}>
        {messages
          .filter((m) => m.role !== "system")
          .map((m, i) => (
            <div key={i} className={`pp-msg ${m.role}`}>
              <div className="pp-bubble">{m.content}</div>
            </div>
          ))}
        {loading && (
          <div className="pp-msg assistant">
            <div className="pp-bubble">Thinking…</div>
          </div>
        )}
      </div>

      <div className="pp-input-row">
        <textarea
          className="pp-input"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
        />
        <button className="pp-send" onClick={send} disabled={loading}>
          Send
        </button>
      </div>

      <style jsx>{`
        .pp-chat-wrap {
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: 12px;
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          padding: 16px;
          background: rgba(12, 18, 35, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
        }
        .pp-chat-header {
          font-weight: 600;
          opacity: 0.9;
        }
        .pp-chat-scroller {
          overflow: auto;
          max-height: calc(70vh);
          padding: 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
        }
        .pp-msg {
          display: flex;
          margin-bottom: 10px;
        }
        .pp-msg.user {
          justify-content: flex-end;
        }
        .pp-msg.assistant {
          justify-content: flex-start;
        }
        .pp-bubble {
          padding: 10px 14px;
          border-radius: 12px;
          line-height: 1.45;
          max-width: 88%;
          white-space: pre-wrap;
        }
        .pp-msg.user .pp-bubble {
          background: rgba(71, 127, 255, 0.2);
          border: 1px solid rgba(71, 127, 255, 0.35);
        }
        .pp-msg.assistant .pp-bubble {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .pp-input-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
        }
        .pp-input {
          resize: none;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          outline: none;
        }
        .pp-send {
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid rgba(71, 127, 255, 0.5);
          background: rgba(71, 127, 255, 0.25);
          cursor: pointer;
        }
        .pp-send:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
