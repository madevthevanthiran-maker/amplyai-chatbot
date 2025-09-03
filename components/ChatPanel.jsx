// components/ChatPanel.jsx
import React from "react";
import {
  loadMessages,
  saveMessages,
  clearMessages,
  newId,
} from "@/lib/persistedChat";
import { messagesToMarkdown, downloadStringAsFile } from "@/lib/exports";
import { track } from "@/lib/analytics";

export default function ChatPanel({
  tabId,
  systemPrompt,
  apiPath = "/api/chat",
  placeholder = "Ask anything…",
}) {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [stopped, setStopped] = React.useState(false);
  const [lastUserMsg, setLastUserMsg] = React.useState(null);
  const [copiedId, setCopiedId] = React.useState(null);
  const [justCopiedTranscript, setJustCopiedTranscript] = React.useState(false);

  const inputRef = React.useRef(null);
  const scrollRef = React.useRef(null);
  const firstLoadRef = React.useRef(true);
  const abortRef = React.useRef(null);

  // Load & persist
  React.useEffect(() => {
    setMessages(loadMessages(tabId));
    queueMicrotask(() => scrollToBottom(false));
    setError(null);
    setStopped(false);
    setLastUserMsg(null);
  }, [tabId]);

  React.useEffect(() => {
    saveMessages(tabId, messages);
  }, [tabId, messages]);

  // Auto-scroll
  React.useEffect(() => {
    const id = requestAnimationFrame(() => scrollToBottom(!firstLoadRef.current));
    firstLoadRef.current = false;
    return () => cancelAnimationFrame(id);
  }, [messages, loading]);

  // Shortcuts
  React.useEffect(() => {
    const onKey = (e) => {
      const meta = e.ctrlKey || e.metaKey;

      // Focus with '/'
      if (e.key === "/" && !e.target.closest("input,textarea")) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      // Send with Cmd/Ctrl + Enter
      if (meta && e.key === "Enter") {
        e.preventDefault();
        if (!loading) send();
        return;
      }
      // Clear chat with Cmd/Ctrl + L
      if (meta && e.key.toLowerCase() === "l") {
        e.preventDefault();
        if (confirm("Clear this chat?")) reset();
        return;
      }
      // Stop with Cmd/Ctrl + .
      if (meta && e.key === ".") {
        e.preventDefault();
        if (loading) stop();
        return;
      }
      // Copy transcript: Cmd/Ctrl + Shift + C
      if (meta && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copyTranscript();
        return;
      }
      // Esc: stop if loading, else blur
      if (e.key === "Escape") {
        if (loading) {
          e.preventDefault();
          stop();
        } else {
          inputRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, messages]);

  const scrollToBottom = (smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight + 9999, behavior: smooth ? "smooth" : "auto" });
  };

  const stop = () => {
    try {
      abortRef.current?.abort();
    } catch {}
    abortRef.current = null;
    setLoading(false);
    setError(null);
    setStopped(true);
    try {
      track("stop_generation", { tab: tabId });
    } catch {}
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setError(null);
    setStopped(false);
    setLoading(true);

    const userMsg = { id: newId(), role: "user", content, ts: Date.now() };
    const base = [...messages, userMsg];

    // Placeholder assistant message to stream into
    const assistantId = newId();
    const assistantMsg = { id: assistantId, role: "assistant", content: "", ts: Date.now() };

    setMessages([...base, assistantMsg]);
    setLastUserMsg(userMsg);
    setInput("");
    try {
      track("message_send", { tab: tabId });
    } catch {}

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(apiPath, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          // minimal bootstrap; server prepends system if provided
          messages: [{ role: "user", content }],
        }),
      });

      if (!resp.ok || !resp.body) {
        let msg = `HTTP ${resp.status}`;
        try {
          const data = await resp.json();
          if (data?.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }

      // Parse SSE stream
      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;
          if (!line.startsWith("data:")) continue;

          const data = line.slice(5).trim();
          if (data === "[DONE]") break;

          try {
            const json = JSON.parse(data);
            const delta = json?.choices?.[0]?.delta?.content || "";
            if (delta) {
              setMessages((curr) =>
                curr.map((m) =>
                  m.id === assistantId ? { ...m, content: (m.content || "") + delta } : m
                )
              );
            }
          } catch {
            // ignore bad chunks
          }
        }
      }

      setStopped(false);
      setError(null);
    } catch (e) {
      if (e?.name === "AbortError") {
        setStopped(true);
        setError(null);
      } else {
        setError(e?.message || "Something went wrong.");
        try {
          track("error", { tab: tabId, message: String(e?.message || e) });
        } catch {}
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const retry = () => lastUserMsg && send(lastUserMsg.content);

  const reset = () => {
    clearMessages(tabId);
    setMessages([]);
    setError(null);
    setStopped(false);
    setLastUserMsg(null);
    firstLoadRef.current = true;
    queueMicrotask(() => scrollToBottom(false));
  };

  const copyText = async (id, text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {}
  };

  const copyTranscript = async () => {
    const md = messagesToMarkdown({ messages, tabId });
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(md);
      } else {
        const ta = document.createElement("textarea");
        ta.value = md;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setJustCopiedTranscript(true);
      setTimeout(() => setJustCopiedTranscript(false), 1500);
      try {
        track("copy_transcript", { tab: tabId });
      } catch {}
    } catch {}
  };

  const downloadTranscript = () => {
    const md = messagesToMarkdown({ messages, tabId });
    const fname = `amplyai_${tabId}_transcript_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.md`;
    downloadStringAsFile(md, fname, "text/markdown");
    try {
      track("download_transcript", { tab: tabId });
    } catch {}
  };

  const handleFeedback = (id, isUp) => {
    try {
      track("feedback_vote", { tab: tabId, vote: isUp ? "up" : "down" });
    } catch {}
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Dark chat container */}
      <div className="h-[calc(100vh-210px)] rounded-2xl border border-gray-800 bg-gray-950 text-gray-100 shadow-lg overflow-hidden">
        {/* Messages */}
        <div ref={scrollRef} className="h-full w-full overflow-y-auto p-4">
          {messages.filter((m) => m.role !== "system").length === 0 ? (
            <div className="text-sm text-gray-400">
              Hey! I’m your Progress Partner. What do you want to do today?
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Write a great email (MailMate)</li>
                <li>Build/refresh your resume (HireHelper)</li>
                <li>Plan study/work for two weeks (Planner)</li>
                <li>Or just ask anything in Chat (general)</li>
              </ul>
            </div>
          ) : (
            <>
              {messages
                .filter((m) => m.role !== "system")
                .map((m) => (
                  <div
                    key={m.id}
                    className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow
                      ${m.role === "user" ? "bg-blue-600/90 text-white" : "bg-gray-800 text-gray-100"}`}
                    >
                      {m.content}
                      {m.role === "assistant" && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                          <button
                            onClick={() => copyText(m.id, m.content)}
                            className="hover:text-gray-200"
                          >
                            {copiedId === m.id ? "Copied!" : "Copy"}
                          </button>
                          <span>·</span>
                          <button onClick={() => handleFeedback(m.id, true)}>👍</button>
                          <button onClick={() => handleFeedback(m.id, false)}>👎</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              {/* Error / Stopped badges */}
              {error && (
                <div className="mb-3">
                  <div className="inline-block rounded-xl bg-red-900/30 text-red-300 text-sm px-3 py-2">
                    ⚠️ {error}{" "}
                    {lastUserMsg && (
                      <button onClick={retry} className="underline">
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )}
              {!error && stopped && (
                <div className="mb-3">
                  <div className="inline-block rounded-xl bg-yellow-900/30 text-yellow-300 text-sm px-3 py-2">
                    ◼︎ Generation stopped
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Input row */}
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 min-w-[200px] rounded-full border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-gray-100
            placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-full border border-gray-800 text-sm text-gray-200 hover:bg-gray-800/70"
            title="Start a new chat"
            disabled={loading}
          >
            New chat
          </button>

          {!loading ? (
            <button
              disabled={!input.trim()}
              className="px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              Send
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="px-5 py-2 rounded-full bg-gray-700 text-gray-100 text-sm font-medium hover:bg-gray-600"
              title="Stop (⌘/Ctrl + .)"
            >
              Stop
            </button>
          )}
        </div>

        {/* Export controls */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={copyTranscript}
            className="px-3 py-2 rounded-full border border-gray-800 text-xs text-gray-200 hover:bg-gray-800/70"
            title="Copy conversation as Markdown (⌘/Ctrl + Shift + C)"
          >
            {justCopiedTranscript ? "Copied chat ✓" : "Copy chat"}
          </button>
          <button
            type="button"
            onClick={downloadTranscript}
            className="px-3 py-2 rounded-full border border-gray-800 text-xs text-gray-200 hover:bg-gray-800/70"
            title="Download conversation as .md"
          >
            Download .md
          </button>
        </div>
      </form>

      {/* helper hint */}
      <div className="text-[11px] text-gray-500">
        Shortcuts: <span className="font-medium text-gray-300">/</span> focus ·{" "}
        <span className="font-medium text-gray-300">⌘/Ctrl + Enter</span> send ·{" "}
        <span className="font-medium text-gray-300">⌘/Ctrl + L</span> clear ·{" "}
        <span className="font-medium text-gray-300">⌘/Ctrl + .</span> stop ·{" "}
        <span className="font-medium text-gray-300">⌘/Ctrl + ⇧ + C</span> copy chat ·{" "}
        <span className="font-medium text-gray-300">Esc</span> blur/stop
      </div>
    </div>
  );
}
