// pages/index.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

/**
 * Progress Partner – Conversational Landing
 * - Small chat UI on the homepage
 * - Recognizes email/resume intents and routes to /email or /hire-helper
 * - Keeps the UX lightweight (no server calls)
 */

export default function ProgressPartner() {
  const router = useRouter();

  // simple in-memory chat log
  const [messages, setMessages] = useState(() => [
    {
      role: "bot",
      text:
        "Hey! I’m your Progress Partner. What do you want to do today?\n\n• Write a great email (MailMate)\n• Build/refresh your resume (HireHelper)\n• Or just ask me something.",
    },
  ]);

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  // auto-scroll to the bottom on new messages
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  // helpers
  const push = (role, text) => setMessages((m) => [...m, { role, text }]);

  const goEmail = () => {
    push("bot", "Awesome — launching MailMate for you ✉️");
    // small delay for a natural feel
    setTimeout(() => router.push("/email"), 400);
  };

  const goResume = () => {
    push("bot", "Sweet — taking you to HireHelper 📄");
    setTimeout(() => router.push("/hire-helper"), 400);
  };

  // very simple intent matcher (case-insensitive, robust to phrasing)
  const detectIntent = (text) => {
    const t = text.toLowerCase();

    const emailWords = ["email", "mail", "outreach", "cold", "write", "compose"];
    const resumeWords = ["resume", "cv", "profile", "hire", "hiring", "job"];

    const emailHit = emailWords.some((w) => t.includes(w));
    const resumeHit = resumeWords.some((w) => t.includes(w));

    if (emailHit && !resumeHit) return "email";
    if (resumeHit && !emailHit) return "resume";

    // if they typed one of our exact quick replies
    if (/mailmate/.test(t)) return "email";
    if (/hirehelper|hire helper/.test(t)) return "resume";

    return "unknown";
  };

  const respond = async (text) => {
    setThinking(true);

    const intent = detectIntent(text);

    if (intent === "email") {
      setThinking(false);
      goEmail();
      return;
    }

    if (intent === "resume") {
      setThinking(false);
      goResume();
      return;
    }

    // fallback suggestions
    await new Promise((r) => setTimeout(r, 300));
    push(
      "bot",
      "I can help you write an email or build a resume.\n\n• Tap **MailMate** to write an email\n• Tap **HireHelper** to work on your resume"
    );
    setThinking(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    setInput("");
    push("user", value);
    await respond(value);
  };

  // quick-reply chips
  const Chips = useMemo(
    () => (
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => {
            push("user", "Open MailMate");
            respond("mailmate");
          }}
          className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
        >
          MailMate (email)
        </button>
        <button
          onClick={() => {
            push("user", "Open HireHelper");
            respond("hirehelper");
          }}
          className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
        >
          HireHelper (resume)
        </button>
        <button
          onClick={() => inputRef.current?.focus()}
          className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
        >
          Ask a question…
        </button>
      </div>
    ),
    []
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-xl font-semibold">AmplyAI — Progress Partner</h1>
        </header>

        <div className="rounded-2xl border bg-white/60 shadow-sm">
          {/* Chat area */}
          <div
            ref={listRef}
            className="max-h-[65vh] overflow-y-auto px-5 py-6 sm:px-6"
          >
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.text} />
            ))}
            {thinking && <TypingBubble />}
            {/* chips under the very first bot message and whenever it makes sense */}
            {messages.length <= 2 && Chips}
          </div>

          {/* Input */}
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 border-t px-4 py-4 sm:px-6"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what you want to do…"
              className="h-11 w-full rounded-xl border px-3 outline-none focus:ring"
            />
            <button
              type="submit"
              disabled={thinking}
              className="h-11 rounded-xl bg-black px-4 text-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>

        {/* Secondary entry points (optional) */}
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a
            href="/email"
            className="rounded-lg border px-3 py-2 hover:bg-gray-50"
          >
            Go to MailMate →
          </a>
          <a
            href="/hire-helper"
            className="rounded-lg border px-3 py-2 hover:bg-gray-50"
          >
            Go to HireHelper →
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI bits ---------- */

function Bubble({ role, text }) {
  const isUser = role === "user";
  return (
    <div className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 leading-relaxed",
          isUser ? "bg-black text-white" : "bg-gray-100",
        ].join(" ")}
      >
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="mb-3 flex justify-start">
      <div className="rounded-2xl bg-gray-100 px-4 py-3">
        <span className="inline-flex gap-1">
          <Dot />
          <Dot style={{ animationDelay: "120ms" }} />
          <Dot style={{ animationDelay: "240ms" }} />
        </span>
      </div>
    </div>
  );
}

function Dot(props) {
  return (
    <span
      className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400"
      {...props}
    />
  );
}
