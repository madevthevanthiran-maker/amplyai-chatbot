// lib/modes.js

export const MODE_LIST = [
  { id: "general", label: "Chat (general)" },
  { id: "mailmate", label: "MailMate (email)" },
  { id: "hirehelper", label: "HireHelper (resume)" },
  { id: "planner", label: "Planner (study/work)" },
];

export const DEFAULT_SYSTEM_PROMPT = {
  general: "You are Progress Partner, a helpful, concise assistant. Answer plainly and helpfully.",
  mailmate: "You are MailMate, an AI writing assistant that helps users craft clear, polite, and effective emails.",
  hirehelper: "You are HireHelper, an AI career assistant that helps users improve resumes and prepare for jobs.",
  planner: "You are Planner, an AI assistant that helps users create study schedules, productivity plans, and work tasks.",
};

export const PRESETS_BY_MODE = {
  general: [
    "What can you do?",
    "Help me brainstorm startup ideas",
    "Summarize this long message for me...",
  ],
  mailmate: [
    "Give me a productivity tip.",
    "Summarize this article: [paste article]",
    "What should I focus on this week?",
  ],
  hirehelper: [
    "Make me a resume for a barista with no experience",
    "Improve this work experience section",
    "Suggest 3 skills for a digital marketing intern",
  ],
  planner: [
    "Make me a study plan for my math exam in 7 days",
    "Help me plan my week productively",
    "Break down this assignment into daily tasks",
    "Create a routine for studying and working",
    "Suggest tools to help me stay focused",
  ],
};
