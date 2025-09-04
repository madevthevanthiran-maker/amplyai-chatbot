// lib/modes.js

export const MODES = {
  general: {
    id: "general",
    title: "Chat (general)",
    description:
      "Ask anything. Get structured answers with sources when useful.",
    // This only shows as a faint hint in the input if the user hasn't typed yet
    template: "",
    presets: [
      { label: "Explain simply", text: "Explain this like I’m 12 and give an example." },
      { label: "Pros & cons", text: "Summarize the pros and cons with a short recommendation." },
      { label: "Outline", text: "Make a 5-bullet outline with one sentence under each." },
    ],
  },

  mailmate: {
    id: "mailmate",
    title: "MailMate (email)",
    description: "Draft a clear, outcome-driven email with subject and variants.",
    template:
`Intent (e.g., cold outreach, follow-up, request):
Recipient (who / role):
Goal (one clear call-to-action):
Context (one paragraph, keep only what matters):
Details (bullets):
Tone (e.g., concise, friendly, confident):
Constraints (if any):`,
    presets: [
      { label: "Intro email", text: "Intent: Intro • Goal: Book a 15-min call • Tone: concise & friendly" },
      { label: "Follow-up", text: "Intent: Follow-up • Goal: Quick nudge after no response • Tone: polite & brief" },
      { label: "Subject lines", text: "Please provide 3 concise subject line options (max 50 chars)." },
      { label: "Short variant", text: "Also provide a shorter ~90-120 word variant." },
    ],
  },

  hirehelper: {
    id: "hirehelper",
    title: "HireHelper (resume)",
    description:
      "Turn messy experience into recruiter-ready bullets. Quantified. STAR-tight.",
    template:
`Role / Company / Dates:
Top responsibilities (bullets):
Impact / outcomes (numbers if possible):
Tools / tech:
STAR details (Situation, Task, Action, Result) if helpful:`,
    presets: [
      { label: "STAR bullets", text: "Create 4-6 bullets in STAR style with measurable outcomes." },
      { label: "Quantify", text: "Rewrite to include concrete numbers and clearer outcomes." },
      { label: "Senior tone", text: "Rewrite for a senior-level tone — crisp, impact-first." },
    ],
  },

  planner: {
    id: "planner",
    title: "Planner (study/work)",
    description: "Break goals into realistic tasks with buffers and schedule.",
    template:
`Goal (one sentence):
Timeframe:
Constraints / availability:
Sub-tasks (bullets if you have them):`,
    presets: [
      { label: "Weekly plan", text: "Make a 1-week plan with daily tasks and realistic buffers." },
      { label: "Study plan", text: "Create a study plan with checkpoints and review sessions." },
      { label: "Risk map", text: "List likely blockers + mitigation steps for each." },
    ],
  },
};

// For chips / tabs etc.
export const MODE_LIST = Object.values(MODES).map(({ id, title }) => ({
  id,
  title,
}));
