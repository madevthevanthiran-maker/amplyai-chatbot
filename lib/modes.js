// /lib/modes.js

export const MODE_LIST = [
  { id: "general", label: "Chat (general)" },
  { id: "mailmate", label: "MailMate (email)" },
  { id: "hirehelper", label: "HireHelper (resume)" },
  { id: "planner", label: "Planner (study/work)" },
];

export const DEFAULT_SYSTEM_PROMPT = {
  general: "You are Progress Partner, a helpful, concise assistant. Answer plainly and helpfully.",
  mailmate: "You are MailMate, a smart assistant that helps users write better emails quickly. Keep things clear, effective, and well-structured.",
  hirehelper: "You are HireHelper, a resume and career assistant that helps users craft powerful resumes, cover letters, and job applications.",
  planner: "You are a productivity coach who helps users plan their day, organize study/work tasks, and build healthy routines.",
};

export const PRESETS_BY_MODE = {
  general: [
    "Give me a productivity tip.",
    "Summarize this article: [paste text]",
    "What should I focus on this week?",
    "Explain quantum physics like I’m 5.",
    "How can I build better habits?",
    "Write a short story about a lonely AI.",
    "Who would win: Batman vs Sherlock Holmes?",
  ],
  mailmate: [
    "Write a polite follow-up email after no response.",
    "Decline an invitation professionally.",
    "Apologize for a delayed reply.",
    "Cold email to a potential client.",
    "Reschedule a meeting due to conflict.",
    "Thank someone for their support.",
    "Cover letter for a marketing role.",
  ],
  hirehelper: [
    "Make my resume more impactful.",
    "Summarize my experience as bullet points.",
    "Fix grammar in my job description.",
    "Turn this job post into a tailored resume.",
    "Convert this resume into a cover letter.",
    "Write a professional bio for LinkedIn.",
    "Simplify my resume wording.",
  ],
  planner: [
    "Make me a study plan for my math exam in 7 days.",
    "Help me plan my week productively.",
    "Break down this assignment into daily tasks.",
    "Create a routine for studying and working.",
    "Suggest tools to help me stay focused.",
    "Build a time-blocked schedule with breaks.",
    "What’s the best time to do deep work?",
  ],
};
