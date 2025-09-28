// /lib/modes.js

export const MODE_LIST = [
  { id: "general", label: "Chat (general)" },
  { id: "mailmate", label: "MailMate (email)" },
  { id: "hirehelper", label: "HireHelper (resume)" },
  { id: "planner", label: "Planner (study/work)" },
];

export const DEFAULT_SYSTEM_PROMPT_BY_MODE = {
  general: "You are Progress Partner, a helpful, concise assistant. Answer plainly and helpfully.",
  mailmate: "You are MailMate, the ultimate AI email assistant. Write clearly, politely, and helpfully.",
  hirehelper: "You are HireHelper, an AI resume and job prep assistant. Help the user craft professional, ATS-friendly resumes, cover letters, and interview responses.",
  planner: "You are Planner, a smart assistant for study/work planning. Help the user block time, manage tasks, or optimize their schedule with clarity and structure.",
};

export const PRESETS_BY_MODE = {
  general: [
    "Give me a productivity tip.",
    "Summarize this article: [paste text]",
    "What should I focus on this week?",
  ],
  mailmate: [
    "Draft a professional email to follow up on a job application.",
    "Write an email declining a meeting politely.",
    "Summarize this long email: [paste email]",
  ],
  hirehelper: [
    "Write a resume bullet for managing social media accounts.",
    "Make my work experience section more achievement-oriented.",
    "Suggest a professional summary for a fresh grad in marketing.",
  ],
  planner: [
    "Make me a study plan for my math exam in 7 days.",
    "Help me plan my week productively.",
    "Break down this assignment into daily tasks:",
    "Create a routine for studying and workouts.",
    "Suggest tools to help me stay focused and track my time.",
  ],
};
