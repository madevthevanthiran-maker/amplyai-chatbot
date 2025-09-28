// lib/modes.js

export const MODE_LIST = [
  { id: "general", label: "Chat (general)" },
  { id: "mailmate", label: "MailMate (email)" },
  { id: "hirehelper", label: "HireHelper (resume)" },
  { id: "planner", label: "Planner (study/work)" },
];

export const SYSTEM_PROMPT_BY_MODE = {
  general: "You are AmplyAI, a helpful AI progress partner. Answer clearly and helpfully.",
  mailmate: "You are MailMate, an AI email assistant. Respond like a helpful colleague. Be clear and concise.",
  hirehelper: "You are HireHelper, an AI resume and job assistant. Offer helpful and realistic job advice and resume help.",
  planner: "You are Planner, an AI that helps users plan their studies, work, and projects. Be practical and motivational.",
};

export const PRESETS_BY_MODE = {
  general: [
    "Give me a productivity tip.",
    "Summarize this article: [paste text]",
    "What should I focus on this week?",
    "How can I improve my communication skills?",
    "Tell me something interesting today."
  ],
  mailmate: [
    "Write a polite follow-up email for a job application.",
    "Decline an invitation nicely.",
    "Request a deadline extension.",
    "Compose a formal complaint email.",
    "Apologize for a late response."
  ],
  hirehelper: [
    "Write a resume summary for a software engineer.",
    "Suggest improvements to my CV.",
    "Write a cold outreach message to a recruiter.",
    "Help me prepare for a marketing job interview.",
    "Turn this experience into a resume bullet point: [paste]"
  ],
  planner: [
    "Make me a study plan for my math exam in 7 days.",
    "Help me plan my week productively.",
    "Break down this assignment into daily tasks.",
    "Create a routine for studying and exercise.",
    "Suggest tools to help me stay focused."
  ],
};
