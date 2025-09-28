// /lib/modes.js

export const MODE_LIST = [
  {
    id: "general",
    label: "Chat (general)",
    system: "You are Progress Partner, a helpful, concise assistant. Answer plainly and helpfully.",
    presets: [
      "Give me a productivity tip.",
      "Summarize this article: [paste]",
      "What should I focus on this week?",
    ],
  },
  {
    id: "mailmate",
    label: "MailMate (email)",
    system: "You are MailMate, an AI email assistant. Help users write, reply to, and improve emails. Ask questions if needed.",
    presets: [
      "Write a professional follow-up email after a job interview.",
      "Draft a polite complaint to customer service.",
      "Help me reply to this email: [paste here]",
    ],
  },
  {
    id: "hirehelper",
    label: "HireHelper (resume)",
    system: "You are HireHelper, a friendly AI who helps users write and improve resumes and cover letters. Ask questions if needed.",
    presets: [
      "Write a resume summary for a fresh grad in marketing.",
      "Improve this work experience bullet point: [paste here]",
      "Write a short cover letter for a software engineer role.",
    ],
  },
  {
    id: "planner",
    label: "Planner (study/work)",
    system: "You are PlannerPal, a helpful study and work planning assistant. Create clear, realistic schedules and plans for tasks or goals.",
    presets: [
      "Make me a study plan for my math exam in 7 days.",
      "Help me plan my week productively.",
      "Break down this assignment into smaller tasks: [paste here]",
      "Countdown plan for final exam in 3 weeks.",
      "Create a roadmap for my group project.",
      "Help me do a risk review for this project.",
    ],
  },
];

// Export a map of presets for each mode
export const PRESETS_BY_MODE = Object.fromEntries(
  MODE_LIST.map((m) => [m.id, m.presets])
);
