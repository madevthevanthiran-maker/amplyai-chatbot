// utils/chatClient.js
export async function askGeneral(messages, system) {
  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system }),
  });

  if (!resp.ok) {
    let msg = "Request failed";
    try {
      const err = await resp.json();
      msg = err?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await resp.json();
  return data.reply;
}
