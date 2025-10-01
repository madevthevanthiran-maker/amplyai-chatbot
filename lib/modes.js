export const PRESETS_BY_MODE = {
  general: [
    "Give me a productivity tip.",
    "Summarize this article: [paste text]",
    "What should I focus on this week?",
  ],
  mailmate: [
    "Write a professional follow-up email.",
    "Draft an email requesting a meeting.",
    "Reply to this complaint: [paste email]",
  ],
  hirehelper: [
    "Write a resume summary for a software engineer.",
    "Improve this experience bullet: [paste text]",
    "Generate a list of soft skills for a CV.",
  ],
  planner: [
    "Make me a study plan for my marketing exam.",
    "Help me plan my week productively.",
    "Break down this assignment into daily tasks.",
  ],
};

export const MODE_SYSTEM_PROMPTS = {
  general: "You are a helpful, friendly assistant.",
  mailmate: "You are an expert email assistant named MailMate.",
  hirehelper: "You are a helpful resume and career writing coach called HireHelper.",
  planner: "You are a study and productivity planning assistant.",
};
