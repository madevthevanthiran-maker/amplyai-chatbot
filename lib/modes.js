// lib/modes.js

export const MODE_LIST = [
  { id: "general", label: "Chat (general)" },
  { id: "mailmate", label: "MailMate (email)" },
  { id: "hirehelper", label: "HireHelper (resume)" },
  { id: "planner", label: "Planner (study/work)" },
];

export const PRESETS_BY_MODE = {
  general: [
    "What's a good productivity tip?",
    "Summarize this article: [paste text]",
    "What should I focus on this week?",
  ],
  mailmate: [
    "Draft a concise cold outreach email. Include 3 subject line options and one shorter variant (~90–100 words).",
    "Write a follow-up email for a client who hasn’t responded in 7 days.",
    "Respond professionally to a dissatisfied customer email.",
  ],
  hirehelper: [
    "Improve this resume bullet: [paste bullet]",
    "Summarize my work experience for a LinkedIn summary.",
    "Make my resume sound more results-driven.",
  ],
  planner: [
    "Help me plan my week productively.",
    "Make me a study plan for my math exam in 7 days.",
    "Break down this assignment into smaller steps: [paste text]",
  ],
};
