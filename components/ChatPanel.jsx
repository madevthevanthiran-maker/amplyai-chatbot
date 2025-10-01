import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";

export default function ChatPanel({ onSend }) {
  const { messages, setMessages, mode } = useAppContext(); // ✅ Use global context
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  // ✅ Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    onSend([...messages, newMessage], mode, setMessages);
    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "user-msg" : "ai-msg"}>
            {m.content}
          </div>
        ))}
        <div ref={chatEndRef} /> {/* auto-scroll anchor */}
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
