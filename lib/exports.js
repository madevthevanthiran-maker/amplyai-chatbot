// lib/exports.js

// Turn chat messages into a tidy Markdown transcript
export function messagesToMarkdown({ messages = [], tabId = "chat", title } = {}) {
  const niceTitle =
    title || `AmplyAI — ${tabIdLabel(tabId)} Transcript (${new Date().toLocaleString()})`;

  const lines = [
    `# ${niceTitle}`,
    ``,
    `_Tip: Lines beginning with **You** are your prompts; **AmplyAI** are responses._`,
    ``,
  ];

  messages
    .filter((m) => m.role !== "system")
    .forEach((m) => {
      const who = m.role === "user" ? "You" : "AmplyAI";
      const content = (m.content || "").trim();
      lines.push(`**${who}:**`);
      lines.push(content.length ? content : "_(empty)_");
      lines.push(""); // blank line between messages
    });

  return lines.join("\n");
}

// Plain text (if you ever need it)
export function messagesToText({ messages = [], tabId = "chat", title }) {
  const niceTitle =
    title || `AmplyAI — ${tabIdLabel(tabId)} Transcript (${new Date().toLocaleString()})`;
  const lines = [`${niceTitle}`, ``];

  messages
    .filter((m) => m.role !== "system")
    .forEach((m) => {
      const who = m.role === "user" ? "You" : "AmplyAI";
      const content = (m.content || "").trim();
      lines.push(`${who}:`);
      lines.push(content.length ? content : "(empty)");
      lines.push("");
    });

  return lines.join("\n");
}

export function downloadStringAsFile(str, filename, mime = "text/markdown") {
  const blob = new Blob([str], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function tabIdLabel(tabId) {
  switch (tabId) {
    case "mailmate":
      return "MailMate";
    case "hirehelper":
      return "HireHelper";
    case "planner":
      return "Planner";
    case "chat":
    default:
      return "Chat";
  }
}
