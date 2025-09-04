// lib/modes.js
export const MODES = {
  general: {
    id: "general",
    title: "Chat (general)",
    description: "Ask anything. Get structured answers with sources when useful.",
    template: "",
    presets: [
      { label: "Summarize text", text: "Summarize the following text into 5 bullets with key facts and a one-line takeaway:\n\n" },
      { label: "Research w/ sources", text: "Research this topic and give a concise summary with 3–5 reputable sources:\n\n" },
      { label: "Brainstorm ideas", text: "Brainstorm 10 creative ideas for:\n\n" },
    ],
  },

  mailmate: {
    id: "mailmate",
    title: "MailMate (email)",
    description: "Draft a clear, outcome-driven email with subject and variants.",
    template:
`Intent (e.g., cold outreach, follow-up, request):
Recipient (role / who they are):
Goal (one clear call-to-action):
Context (what they know / constraints):
Tone (e.g., concise, friendly, confident):

Return:
1) 120–160 word email (tight, outcome-driven)
2) 3 subject line options
3) 1 shorter variant (~80–100 words)`,
    presets: [
      { label: "Cold outreach", text:
`Write a concise cold outreach email:
Recipient: Hiring Manager at [Company]
Goal: 15-min intro call
Context: I’m [your role]. Relevant proof: [brief proof].
Tone: concise, confident, friendly.

Return the email (120–160w) + 3 subject options + 1 shorter variant.` },
      { label: "Follow-up", text:
`Write a polite follow-up email:
Recipient: [Name], [Role]
Context: We last spoke on [date] about [topic].
Goal: nudge for next step.
Tone: brief, warm, professional.

Return email + 3 subject lines.` },
      { label: "Introduce yourself", text:
`Introduce yourself via email in 120–160 words.
Role: [your role]
Audience: [audience]
Goal: [clear ask]
Tone: confident, friendly.` },
    ],
  },

  hirehelper: {
    id: "hirehelper",
    title: "HireHelper (resume)",
    description: "Turn experience into recruiter-ready STAR bullets. Quantified.",
    template:
`Paste raw notes or experience. Return 3–5 STAR bullets with impact, metrics, and strong action verbs.
Format:
• [Action] + [What] + [How] + [Result w/ numbers]
• Keep to one line each.`,
    presets: [
      { label: "STAR bullets", text:
`Convert the following messy notes into 5 STAR resume bullets with action verbs and metrics. Keep each bullet to one line:` },
      { label: "Compress bullets", text:
`Rewrite these bullets to be tighter and quantified. Keep strongest verbs, remove fluff, keep one line each:` },
      { label: "Tailor to job", text:
`Tailor these bullets to the following job description (match keywords & outcomes). Return 5 bullets:` },
    ],
  },

  planner: {
    id: "planner",
    title: "Planner (study/work)",
    description: "Break goals into tasks, add buffers, and set a realistic plan.",
    template:
`Goal (one sentence):
Constraints (deadlines, blockers, hours):
Work blocks available (e.g., weekdays 6–9pm, Sat mornings):
Priorities (1–3):
Return:
• A 7-day plan with tasks, buffers, and short daily checklist
• One paragraph of tips to avoid over-scheduling`,
    presets: [
      { label: "Plan my week", text:
`Create a realistic 7-day plan for this goal, with daily tasks, buffers, and a short checklist:
Goal:` },
      { label: "Break down project", text:
`Break this project into milestones & tasks with sensible estimates. Note risks + buffers:` },
      { label: "Study schedule", text:
`Make a weekly study plan for this exam/course with daily blocks, active recall, and spaced repetition:` },
    ],
  },
};
