// pages/chat.jsx
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I’m your Progress Partner. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  // Persist chat
  useEffect(() => {
    const saved = localStorage.getItem("pp-general-chat");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("pp-general-chat", JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e) {
    e?.preventDefault?.();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMsgs = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMsgs);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMsgs }),
      });
      const data = await resp.json();
      if (data?.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Hmm, I couldn’t generate a reply just now." },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Server error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      {/* Top nav pills (match your style) */}
      <header className="topbar">
        <div className="brand">
          <span className="dot" /> AmplyAI <span className="sep">—</span> Progress Partner
        </div>
        <nav className="pills">
          <Link href="/" className="pill">Home</Link>
          <Link href="/email" className="pill">MailMate</Link>
          <Link href="/hire-helper" className="pill">HireHelper</Link>
          <Link href="/planner" className="pill">Planner</Link>
          <Link href="/chat" className="pill pill-active">Chat</Link>
        </nav>
      </header>

      <main className="wrap">
        <div className="chat">
          <div className="messages">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`bubble ${m.role === "user" ? "me" : "bot"}`}
              >
                <div className="meta">{m.role === "user" ? "You" : "PP"}</div>
                <div className="content">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="bubble bot">
                <div className="meta">PP</div>
                <div className="content">Thinking…</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="composer" onSubmit={sendMessage}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything… (e.g., 'explain webhooks', 'best study plan for finals')"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) sendMessage(e);
              }}
            />
            <button disabled={loading} type="submit">
              {loading ? "Sending…" : "Send"}
            </button>
          </form>
        </div>
      </main>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: radial-gradient(1200px 600px at 20% 0%, #0b1730 0%, #081226 35%, #070f1f 60%, #060d1a 100%);
          color: #e6edff;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
        }
        .brand { font-weight: 600; display: flex; align-items: center; gap: 8px; opacity: .95; }
        .dot { width: 8px; height: 8px; background: #5bd1ff; border-radius: 50%; display: inline-block; }
        .sep { opacity: .5; margin: 0 8px; }
        .pills { display: flex; gap: 8px; }
        .pill {
          padding: 8px 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          font-size: 14px;
        }
        .pill:hover { background: rgba(255,255,255,0.08); }
        .pill-active { background: #2a5eff; border-color: #2a5eff; color: white; }
        .wrap { max-width: 980px; margin: 0 auto; padding: 16px; }
        .chat {
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,.25);
          overflow: hidden;
        }
        .messages {
          max-height: min(62vh, 560px);
          overflow-y: auto;
          padding: 16px;
        }
        .bubble {
          max-width: 85%;
          padding: 10px 12px;
          border-radius: 12px;
          margin: 10px 0;
          line-height: 1.45;
          white-space: pre-wrap;
          word-break: break-word;
          border: 1px solid rgba(255,255,255,.07);
        }
        .bubble.me { margin-left: auto; background: rgba(83, 131, 255, .15); border-color: rgba(83,131,255,.4); }
        .bubble.bot { margin-right: auto; background: rgba(255,255,255,.03); }
        .meta { font-size: 12px; opacity: .65; margin-bottom: 6px; }
        .composer {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.15);
        }
        .composer input {
          height: 44px;
          padding: 0 14px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          color: #e6edff;
          border: 1px solid rgba(255,255,255,0.1);
          outline: none;
        }
        .composer input::placeholder { color: rgba(230,237,255,.5); }
        .composer button {
          min-width: 96px;
          height: 44px;
          border-radius: 10px;
          border: 1px solid #2a5eff;
          background: #2a5eff;
          color: white;
          font-weight: 600;
        }
        .composer button[disabled] {
          opacity: .75;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
