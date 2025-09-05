// lib/modes.js

export const MODE_LIST = [
  { id: "general",   label: "Chat (general)" },
  { id: "mailmate",  label: "MailMate (email)" },
  { id: "hirehelper",label: "HireHelper (resume)" },
  { id: "planner",   label: "Planner (study/work)" },
];

export const PRESETS_BY_MODE = {
  general: [
    { label: "Summarize",     text: "Summarize this with bullets and a clear takeaway." },
    { label: "Explain simply",text: "Explain this like I’m 12, with a quick example." },
  ],
  mailmate: [
    { label: "Cold outreach",
      text: "Draft a concise cold outreach email. Include 3 subject line options and one shorter variant (~90–100 words)." },
    { label: "Follow-up",
      text: "Write a polite follow-up email referencing our last message and propose a specific next step." },
  ],
  hirehelper: [
    { label: "STAR bullet",
      text: "Turn this into 1–2 quantified STAR resume bullets (Situation/Task, Action, Result) using strong verbs." },
    { label: "Tailor job",
      text: "Rewrite my resume bullets to match this job description, keeping metrics strong and verbs varied." },
  ],
  planner: [
    { label: "Task plan",
      text: "Break this goal into realistic tasks with buffers and a suggested schedule. Include risks and mitigations." },
    { label: "Weekly plan",
      text: "Create a weekly plan with prioritized tasks, realistic time estimates, and buffers." },
  ],
};
