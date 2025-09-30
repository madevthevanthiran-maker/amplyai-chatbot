// lib/modes.js

export const MODE_LIST = [
  { id: "general", label: "Chat (general)" },
  { id: "mailmate", label: "MailMate (email)" },
  { id: "hirehelper", label: "HireHelper (resume)" },
  { id: "planner", label: "Planner (study/work)" }
];

export const PRESETS_BY_MODE = {
  general: [
    "Give me a productivity tip.",
    "Summarize this article: [paste link]",
    "What should I focus on this week?"
  ],
  mailmate: [
    "Draft a concise cold outreach email. Include 3 subject line options and one shorter variant (~90–100 words).",
    "Write a follow-up email after no response for 5 days.",
    "Polish this email to sound more professional: [paste email]"
  ],
  hirehelper: [
    "Rewrite my resume bullet to sound more impactful: [paste bullet]",
    "Summarize my experience for a cover letter: [paste job description]",
    "Turn this job description into a resume bullet: [paste task]"
  ],
  planner: [
    "Make me a study plan for my math exam in 7 days.",
    "Help me plan my week productively.",
    "Break down this assignment into smaller chunks: [paste assignment]",
    "Create a routine for studying while working part-time.",
    "Suggest tools to help me stay focused while studying."
  ]
};
