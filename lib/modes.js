// ✅ /lib/modes.js — fixed export with full premade prompts

export const MODE_LIST = [
  { id: "general", label: "Chat (general)" },
  { id: "mailmate", label: "MailMate (email)" },
  { id: "hirehelper", label: "HireHelper (resume)" },
  { id: "planner", label: "Planner (study/work)" },
];

export const PRESETS_BY_MODE = {
  general: [
    "Give me a productivity tip.",
    "Summarize this article: [paste]",
    "What should I focus on this week?",
  ],
  mailmate: [
    "Write a professional email to request time off.",
    "Reply to a job interview email positively.",
    "Politely decline a sales offer email.",
  ],
  hirehelper: [
    "Improve my resume for a software engineer role.",
    "Write a short and powerful bio for my CV.",
    "Generate bullet points for my internship experience.",
  ],
  planner: [
    "Make me a study plan for my math exam in 7 days.",
    "Help me plan my week productively.",
    "Break down this assignment into tasks.",
  ],
};
