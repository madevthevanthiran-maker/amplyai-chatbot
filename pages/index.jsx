import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function ProgressPartner() {
  const [messages, setMessages] = useState([
    {
      id: "m0",
      from: "bot",
      text:
        "Hey! I’m your Progress Partner. What do you want to do today?\n\n• Write a great email (MailMate)\n• Build/refresh your resume (HireHelper)\n• Or just ask me something here.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pendingText, setPendingText] = useState(""); // for typewriter
  const scrollRef = useRef(null);

  // auto–scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping, pendingText]);

  // Typewriter effect for the last bot message (in pendingText)
  useEffect(() => {
    if (!pendingText) return;
    const id = `m${Date.now()}`;
    let i = 0;

    setMessages((prev) => [...prev, { id, from: "bot", text: "" }]);

    const timer = setInterval(() => {
      i++;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, text: pendingText.slice(0, i) } : m
        )
      );
      if (i >= pendingText.length) {
        clearInterval(timer);
        setPendingText("");
      }
    }, 12); // feel free to slow to ~18–24 for longer responses
    return () => clearInterval(timer);
  }, [pendingText]);

  const ask = async (text) => {
    // show user message
    const uid = `u${Date.now()}`;
    setMessages((prev) => [...prev, { id: uid, from: "user", text }]);
    setInput("");

    // show typing dots
    setIsTyping(true);

    // Try your /api/chat endpoint if present; otherwise fall back.
    let reply = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        reply = data?.reply || data?.text || "Got it! What next?";
      } else {
        reply =
          "I got your message! (FYI: the chat API didn’t respond here, but I’m still with you.)";
      }
    } catch (_) {
      reply =
        "I’m here. (Looks like the chat API is unavailable.) You can still jump into MailMate or HireHelper below!";
    } finally {
      setIsTyping(false);
    }

    // stream via typewriter
    setPendingText(reply);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    ask(input.trim());
  };

  // Quick suggestion chips -> sends natural-language intents
  const quickAsk = (q) => ask(q);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">AmplyAI — Progress Partner</div>
        <nav className="navlinks">
          <Link href="/email" className="link">
            MailMate
          </Link>
          <Link href="/hire-helper" className="link">
            HireHelper
          </Link>
        </nav>
      </header>

      <main className="wrap">
        <div className="card">
          <div className="chat">
            {messages.map((m) => (
              <Bubble key={m.id} from={m.from} text={m.text} />
            ))}

            {isTyping && (
              <div className="row">
                <div className="avatar bot">PP</div>
                <div className="bubble bot typing">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>

          {/* Quick Actions */}
          <div className="actions">
            <Link href="/email" className="btn primary">
              ✉️ MailMate (email)
            </Link>
            <Link href="/hire-helper" className="btn">
              🧰 HireHelper (resume)
            </Link>
            <button
              className="btn ghost"
              onClick={() =>
                quickAsk(
                  "What can you do for job search? Give me options I can click."
                )
              }
            >
              💡 What can you do?
            </button>
          </div>

          {/* Ask box */}
          <form onSubmit={handleSubmit} className="ask">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what you want to do…"
              aria-label="Type your request"
            />
            <button className="send" type="submit" disabled={!input.trim()}>
              Send
            </button>
          </form>
        </div>
      </main>

      <style jsx>{`
        :root {
          --bg: #0b0c0f;
          --panel: #11131a;
          --bubble: #151826;
          --bubble-user: #1f2a44;
          --text: #e8ecf3;
          --muted: #9aa6b2;
          --brand: #8ab4ff;
          --accent: #7c98ff;
          --ring: #304ffe33;
          --border: #1f2430;
        }
        * {
          box-sizing: border-box;
        }
        body,
        html,
        #__next {
          height: 100%;
        }
        .page {
          min-height: 100vh;
          background: radial-gradient(1200px 600px at 10% -10%, #0d1222 10%, transparent 60%),
            radial-gradient(900px 400px at 90% -15%, #0f0f1d 10%, transparent 60%),
            var(--bg);
          color: var(--text);
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 980px;
          margin: 0 auto;
          padding: 20px 16px;
        }
        .brand {
          font-weight: 700;
          letter-spacing: 0.2px;
        }
        .navlinks {
          display: flex;
          gap: 12px;
        }
        .link {
          color: var(--muted);
          text-decoration: none;
          border: 1px solid var(--border);
          padding: 8px 10px;
          border-radius: 10px;
        }
        .link:hover {
          color: var(--text);
          border-color: #2a3040;
        }

        .wrap {
          max-width: 980px;
          margin: 0 auto;
          padding: 16px;
        }
        .card {
          background: linear-gradient(180deg, #0f1220, #0f1119);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 10px 40px #00000055, inset 0 0 0 1px #ffffff05;
        }

        .chat {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 8px 4px 6px;
          max-height: 55vh;
          overflow: auto;
          scroll-behavior: smooth;
        }
        .row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .avatar {
          width: 32px;
          height: 32px;
          background: #1a2030;
          border: 1px solid var(--border);
          color: var(--muted);
          border-radius: 8px;
          display: grid;
          place-items: center;
          font-size: 12px;
          user-select: none;
        }
        .avatar.user {
          background: #1d263a;
          color: #b5c7ff;
          border-color: #27304a;
        }
        .bubble {
          max-width: 85%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--border);
          white-space: pre-wrap;
          line-height: 1.4;
        }
        .bubble.bot {
          background: var(--bubble);
        }
        .bubble.user {
          background: var(--bubble-user);
        }
        .typing {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #bec8ff;
          opacity: 0.25;
          animation: blink 1.2s infinite ease-in-out;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes blink {
          0%,
          80%,
          100% {
            opacity: 0.25;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 14px 4px 4px;
        }
        .btn {
          border: 1px solid var(--border);
          background: #111523;
          color: var(--text);
          border-radius: 12px;
          padding: 10px 14px;
          cursor: pointer;
          text-decoration: none;
          font: inherit;
        }
        .btn:hover {
          border-color: #2a3040;
        }
        .btn.primary {
          background: linear-gradient(180deg, #182248, #131d3a);
          border-color: #2b3658;
        }
        .btn.ghost {
          background: transparent;
        }

        .ask {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px dashed var(--border);
        }
        .ask input {
          height: 44px;
          border-radius: 12px;
          background: #0e1323;
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0 12px;
          outline: none;
        }
        .ask input:focus {
          border-color: #2a3563;
          box-shadow: 0 0 0 4px var(--ring);
        }
        .send {
          height: 44px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid #2a3563;
          background: linear-gradient(180deg, #1b2a61, #162354);
          color: #e9edff;
          cursor: pointer;
        }
        .send:disabled {
          opacity: 0.5;
          cursor: default;
        }
      `}</style>
    </div>
  );
}

function Bubble({ from, text }) {
  return (
    <div className="row">
      <div className={`avatar ${from === "user" ? "user" : "bot"}`}>
        {from === "user" ? "You" : "PP"}
      </div>
      <div className={`bubble ${from === "user" ? "user" : "bot"}`}>{text}</div>
      <style jsx>{`
        .row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .avatar {
          width: 32px;
          height: 32px;
          background: #1a2030;
          border: 1px solid #1f2430;
          color: #9aa6b2;
          border-radius: 8px;
          display: grid;
          place-items: center;
          font-size: 12px;
          user-select: none;
          flex: 0 0 auto;
        }
        .avatar.user {
          background: #1d263a;
          color: #b5c7ff;
          border-color: #27304a;
        }
        .bubble {
          max-width: 85%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #1f2430;
          white-space: pre-wrap;
          line-height: 1.4;
        }
        .bubble.user {
          background: #1f2a44;
        }
        .bubble.bot {
          background: #151826;
        }
      `}</style>
    </div>
  );
}
