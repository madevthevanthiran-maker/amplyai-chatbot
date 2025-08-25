import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input) return;
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();

    setMessages([...messages, { role: "user", content: input }, { role: "assistant", content: data.reply }]);
    setInput("");
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", fontFamily: "Arial" }}>
      <h1>AmplyAI Chatbot</h1>
      <div style={{ border: "1px solid #ddd", padding: "10px", height: "300px", overflowY: "auto", marginBottom: "10px" }}>
        {messages.map((msg, i) => (
          <p key={i}><b>{msg.role}:</b> {msg.content}</p>
        ))}
        {loading && <p><i>Thinking...</i></p>}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "80%", padding: "8px" }}
        placeholder="Type your message..."
      />
      <button onClick={sendMessage} style={{ width: "18%", padding: "8px", marginLeft: "2%" }}>
        Send
      </button>
    </div>
  );
}
