// /lib/modes.js

export const MODE_LIST = [
  {
    id: "general",
    label: "Chat (general)",
    system: "You are AmplyAI, a helpful general assistant.",
    presets: [
      "Give me a productivity tip.",
      "Summarize this article: [paste text]",
      "What should I focus on this week?",
    ],
  },
  {
    id: "mailmate",
    label: "MailMate (email)",
    system: "You are AmplyAI MailMate, an assistant for writing clear, professional, and friendly emails.",
    presets: [
      "Draft a professional follow-up email.",
      "Draft an email requesting a meeting.",
      "Reply to this complaint: [paste email]",
    ],
  },
  {
    id: "hirehelper",
    label: "HireHelper (resume)",
    system: "You are AmplyAI HireHelper, an assistant that improves resumes and job applications.",
    presets: [
      "Polish my resume summary.",
      "Improve these bullet points: [paste text]",
      "Make my CV stand out for a recruiter.",
    ],
  },
  {
    id: "planner",
    label: "Planner (study/work)",
    system: "You are AmplyAI Planner, an assistant for breaking down goals into tasks, schedules, and study plans.",
    presets: [
      "Make me a study plan for my marketing exam.",
      "Help me plan my week productively.",
      "Break down this assignment into smaller tasks.",
    ],
  },
];
