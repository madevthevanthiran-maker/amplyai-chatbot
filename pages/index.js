import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

function inferIntent(text) {
  const t = text.toLowerCase();

  // resume helper
  if (/\b(resume|cv|curriculum|ats)\b/.test(t)) return "resume";

  // mailmate email
  if (/\b(email|outreach|mail|cold|follow[- ]?up|compose)\b/.test(t)) return "email";

  // generic small talk / unknown
  return "chat";
}

export default function HomeChat() {
  const router = useRouter();
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content:
        "Hey! I’m AmplyAI. What do you want to do today?\n\n• Write a great email (MailMate)\n• Build/refresh your resume (Resume Helper)\n• Or just ask me questions here.",
    },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  const send = async (text) => {
    const userText = (text ?? input).trim();
    if (!userText) return;

    setMessages((m) => [...m, { role: "user", content: userText }]);
    setInput("");

    // figure out where to go
    const intent = inferIntent(userText);

    if (intent === "resume") {
      setMessages((m) => [
        ...m,
        { role: "bot", content: "Got it — opening Resume Helper…" },
      ]);
      // give UI a sec to show the message
      setTimeout(() => router.push("/resume-builder"), 350);
      return;
    }

    if (intent === "email") {
      setMessages((m) => [
        ...m,
        { role: "bot", content: "Nice — let’s write an email with MailMate…" },
      ]);
      setTimeout(() => router.push("/email"), 350);
      return;
    }

    // lightweight built-in small talk response
    const reply =
      "I can help with:\n• **Resume Helper** – type “resume” or click the button\n• **MailMate (Email)** – type “email” or click the button\n\nWhich one should we open?";
    setMessages((m) => [...m, { role: "bot", content: reply }]);
  };

  return (
    <div className="wrap">
      <header className="header">
        <h1>
          <span className="brand">AmplyAI</span> — Assistant
        </h1>
      </header>

      <div className="chat" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, "<br/>") }} />
          </div>
        ))}
      </div>

      <div className="quick">
        <button onClick={() => send("resume")}>Resume Helper</button>
        <button onClick={() => send("email")}>MailMate (Email)</button>
        <button onClick={() => send("help me decide")}>Not sure</button>
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          placeholder="Tell me what you want to do… (e.g., “write a cold email”, “fix my resume”)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="primary" type="submit">
          Send
        </button>
      </form>

      <style jsx>{`
        .wrap {
          max-width: 820px;
          margin: 32px auto;
          padding: 0 16px 24px;
        }
        .header { margin-bottom: 10px; }
        .brand { color: #111827; }
        .chat {
          height: 58vh;
          min-height: 420px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          overflow-y: auto;
          background: #fff;
        }
        .bubble {
          max-width: 92%;
          padding: 10px 12px;
          border-radius: 12px;
          margin: 8px 0;
          line-height: 1.45;
          box-shadow: 0 1px 0 rgba(0,0,0,0.02);
          word-break: break-word;
        }
        .bubble.user {
          background: #111827;
          color: #fff;
          margin-left: auto;
          border-bottom-right-radius: 4px;
        }
        .bubble.bot {
          background: #f3f4f6;
          color: #111827;
          border-bottom-left-radius: 4px;
        }
        .quick {
          display: flex;
          gap: 8px;
          margin: 10px 0 6px;
          flex-wrap: wrap;
        }
        .quick button {
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
        }
        .quick button:hover { background: #f9fafb; }
        .composer {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          margin-top: 6px;
        }
        input {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px;
        }
        .primary {
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 0 16px;
        }
        @media (max-width: 700px) {
          .chat { height: 60vh; }
          .bubble { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
