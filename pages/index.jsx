// pages/index.jsx
import { useEffect, useMemo, useRef, useState } from "react";

const TABS = [
  { id: "chat", label: "Chat (general)" },
  { id: "mail", label: "MailMate (email)" },
  { id: "hire", label: "HireHelper (resume)" },
  { id: "plan", label: "Planner (study/work)" },
];

// System prompts used per tab.
// Feel free to tweak the wording later.
const SYSTEM_PROMPTS = {
  chat:
    "You are Progress Partner, a helpful, concise assistant. Answer plainly and helpfully. If a user asks follow-ups, keep context.",
  mail: `
You are MailMate. Generate clean, professional emails based on the user's ask.
- Keep it concise, clear and friendly.
- Return just the email body (no extra commentary).
- Add an email subject line at the top as "Subject: ...".
- Offer 2 variants if the user asks for options.
`,
  hire: `
You are HireHelper. Help users write bullets and summaries for resumes.
- Use action verbs, impact, metrics when possible.
- Keep bullets short (1–2 lines).
- Return clean, copy-pasteable text (no extra commentary).
`,
  plan: `
You are Planner. Help users plan their next two weeks for study/work.
- Ask for hours/day, available days, deadlines.
- Suggest a simple 14-day plan broken into days and tasks, compact and clear.
`,
};

export default function Home() {
  // Which tab is active
  const [mode, setMode] = useState("chat");

  // Preserve separate conversations per tab so switching doesn’t wipe the history
  const [convos, setConvos] = useState({
    chat: [],
    mail: [],
    hire: [],
    plan: [],
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const messages = convos[mode];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mode]);

  // Compose a user message and call the /api/chat endpoint with the right system prompt
  const send = async () => {
    if (!input.trim() || loading) return;

    const newUserMsg = { role: "user", content: input.trim() };
    const next = [...messages, newUserMsg];

    setConvos((prev) => ({ ...prev, [mode]: next }));
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: SYSTEM_PROMPTS[mode],
          messages: next,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error("Chat API failed:", text);
        throw new Error("Chat API failed");
      }

      const data = await resp.json();
      const replyText = data?.reply || "Sorry, I couldn’t generate a reply.";

      setConvos((prev) => ({
        ...prev,
        [mode]: [...prev[mode], { role: "assistant", content: replyText }],
      }));
    } catch (e) {
      console.error(e);
      setConvos((prev) => ({
        ...prev,
        [mode]: [
          ...prev[mode],
          { role: "assistant", content: "Hmm... I couldn’t reply right now. Try again?" },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  const placeholder = useMemo(() => {
    switch (mode) {
      case "mail":
        return "e.g., write a concise follow-up email after a demo…";
      case "hire":
        return "e.g., turn this experience into 3 resume bullets…";
      case "plan":
        return "e.g., plan 2 weeks for finals, 2h/day, Mon-Fri…";
      default:
        return "Type a message…";
    }
  }, [mode]);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="dot" /> <span className="brandName">AmplyAI</span>
          <span className="divider">—</span>
          <span className="title">Progress Partner</span>
        </div>

        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${mode === t.id ? "active" : ""}`}
              onClick={() => setMode(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="shell">
        <div className="chatCard">
          {/* Optional tiny header buttons for quick context */}
          <div className="miniTabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`miniTab ${mode === t.id ? "active" : ""}`}
                onClick={() => setMode(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="chatWindow">
            {messages.length === 0 && (
              <div className="starter">
                <p className="starterTitle">
                  Hey! I’m your Progress Partner. What do you want to do today?
                </p>
                <ul className="starterList">
                  <li>Write a great email (MailMate)</li>
                  <li>Build/refresh your resume (HireHelper)</li>
                  <li>Plan study/work for two weeks (Planner)</li>
                  <li>Or just ask anything in Chat (general)</li>
                </ul>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`msgRow ${m.role}`}>
                <div className="avatar">{m.role === "assistant" ? "PP" : "You"}</div>
                <div className="bubble">
                  <pre className="content">{m.content}</pre>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="inputRow">
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={placeholder}
            />
            <button className="send" onClick={send} disabled={loading}>
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: radial-gradient(1200px 700px at 20% -10%, #0b1b3a55, transparent),
            radial-gradient(900px 600px at 80% -10%, #0b1b3a55, transparent), #0b1526;
          color: #e9eefc;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          opacity: 0.95;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #56a8ff;
        }
        .brandName {
          font-weight: 700;
        }
        .divider {
          opacity: 0.5;
        }
        .title {
          opacity: 0.8;
        }
        .tabs {
          display: flex;
          gap: 8px;
        }
        .tab {
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid #2c3d62;
          background: #0f1d34;
          color: #c9d8ff;
        }
        .tab.active {
          background: #2b59ff22;
          border-color: #5b7cff;
          color: #e9efff;
        }
        .shell {
          display: flex;
          justify-content: center;
          padding: 24px;
        }
        .chatCard {
          width: 100%;
          max-width: 980px;
          background: #0e1a2d;
          border: 1px solid #1f2c4a;
          border-radius: 16px;
          box-shadow: 0 6px 40px rgba(5, 12, 28, 0.5);
          padding: 14px;
        }
        .miniTabs {
          display: flex;
          gap: 8px;
          padding: 4px 6px 10px;
        }
        .miniTab {
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid #203356;
          background: #0f1d34;
          color: #a9b9e9;
          font-size: 12px;
        }
        .miniTab.active {
          background: #2b59ff22;
          border-color: #5b7cff;
          color: #e9efff;
        }
        .chatWindow {
          height: 56vh;
          overflow: auto;
          background: #0b1524;
          border: 1px solid #17294a;
          border-radius: 12px;
          padding: 14px;
        }
        .starter {
          opacity: 0.9;
          padding: 6px 2px 8px;
        }
        .starterTitle {
          margin: 0 0 6px;
          font-weight: 600;
        }
        .starterList {
          margin: 0;
          padding-left: 18px;
          opacity: 0.85;
        }
        .msgRow {
          display: flex;
          gap: 10px;
          margin: 10px 0;
        }
        .msgRow .avatar {
          min-width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 12px;
          background: #112246;
          color: #b9cbff;
          border: 1px solid #1c2c52;
        }
        .msgRow.user .avatar {
          background: #1a2644;
          color: #dfe7ff;
        }
        .bubble {
          background: #0f1e3a;
          border: 1px solid #1c2c52;
          padding: 10px 12px;
          border-radius: 12px;
          max-width: 80%;
          white-space: pre-wrap;
        }
        .content {
          margin: 0;
          font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono",
            "Roboto Mono", monospace;
          font-size: 13.5px;
          line-height: 1.45;
        }
        .inputRow {
          display: flex;
          gap: 10px;
          margin-top: 12px;
        }
        .input {
          flex: 1;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid #21325a;
          background: #0e1a2d;
          color: #e9eefc;
          outline: none;
        }
        .send {
          padding: 0 18px;
          border-radius: 12px;
          background: #2c55ff;
          color: white;
          border: none;
          min-width: 84px;
        }
        .send:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
