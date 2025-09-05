// lib/modes.js

export const MODE_LIST = [
  { id: "general",   label: "Chat (general)" },
  { id: "mailmate",  label: "MailMate (email)" },
  { id: "hirehelper",label: "HireHelper (resume)" },
  { id: "planner",   label: "Planner (study/work)" },
];

export const PRESETS_BY_MODE = {
  /* Keep general light and utility-focused */
  general: [
    { label: "Summarize",      text: "Summarize this with bullets and a clear takeaway." },
    { label: "Explain simply", text: "Explain this like I’m 12, with a quick example." },
    { label: "Pros & cons",    text: "Give a short pros/cons list and a recommendation." },
    { label: "Action steps",   text: "Turn this into 5–8 specific next actions with owners and timing." },
  ],

  /* ————————————————  MailMate (email)  ———————————————— */
  mailmate: [
    {
      label: "Cold outreach",
      text: "Draft a concise cold outreach email. Include 3 subject line options and one shorter variant (~90–100 words)."
    },
    {
      label: "Follow-up",
      text: "Write a polite follow-up email referencing our last message and propose a specific next step."
    },
    {
      label: "Warm intro",
      text: "Write an intro email leveraging a mutual connection. Keep tone friendly and credible. Include 2 subject lines."
    },
    {
      label: "Meeting recap",
      text: "Create a meeting recap email with bullets for decisions, open items, and next steps with owners & due dates."
    },
    {
      label: "Status update",
      text: "Draft a brief status update for a stakeholder: progress, risks, mitigations, and next milestones (bulleted)."
    },
    {
      label: "Reminder / nudge",
      text: "Write a friendly reminder about a pending reply or deliverable. Offer 2–3 time options for a quick call."
    },
    {
      label: "Thank-you (interview)",
      text: "Send a thank-you email after an interview. Reference 1–2 specifics you enjoyed and restate your value."
    },
    {
      label: "Apology + fix",
      text: "Write an apology email that owns the issue and outlines a clear corrective action plan with timelines."
    },
    {
      label: "Proposal",
      text: "Draft a proposal email with bullets for scope, timeline, pricing, and next step. Keep it crisp and confident."
    },
    {
      label: "Partnership pitch",
      text: "Pitch a lightweight partnership. Include value for both sides, suggested pilot, and a low-friction next step."
    },
    {
      label: "Support reply",
      text: "Reply to a customer bug report. Acknowledge impact, share what you found, workaround (if any), and ETA."
    },
    {
      label: "Newsletter blurb",
      text: "Write an 80–100 word announcement for a product update. Include a short CTA and 2 subject line options."
    },
    {
      label: "Scheduling",
      text: "Propose a meeting with 3 time slots, calendar link, and fallback async option. Keep it friendly and direct."
    },
    {
      label: "Churn save",
      text: "Write a retention email to a canceling customer. Empathize, offer 2 concrete fixes or incentives, and a call."
    },
  ],

  /* ————————————————  HireHelper (resume)  ———————————————— */
  hirehelper: [
    {
      label: "STAR bullet",
      text: "Turn this into 1–2 quantified STAR resume bullets (Situation/Task, Action, Result) using strong verbs."
    },
    {
      label: "Tailor to JD",
      text: "Rewrite my resume bullets to match this job description, keeping metrics strong and verbs varied."
    },
    {
      label: "Quantify impact",
      text: "Take vague statements and quantify results (%, $, time saved). Suggest measurable metrics I can use."
    },
    {
      label: "Internship merge",
      text: "Condense multiple internships into 3 concise results-focused bullets that highlight growth and impact."
    },
    {
      label: "Project write-up",
      text: "Rewrite a project description: problem, approach, stack/tools, outcomes/metrics—1–2 crisp bullets."
    },
    {
      label: "LinkedIn headline",
      text: "Create a LinkedIn headline and a 220–260 character ‘About’ summary aligned with the target role."
    },
    {
      label: "Cover letter opener",
      text: "Draft a compelling opening paragraph for a cover letter tailored to this job description and company."
    },
    {
      label: "Skills matrix",
      text: "Organize skills into clusters (Languages, Frameworks, Data, Cloud/DevOps, Tools) with compact bullets."
    },
    {
      label: "Early-career resume",
      text: "No experience? Emphasize class projects, volunteering, and skills with impact-oriented bullets (ATS-friendly)."
    },
    {
      label: "Executive summary",
      text: "Create a 3–4 bullet professional summary at the top of the resume that signals scope, impact, and strengths."
    },
    {
      label: "ATS optimization",
      text: "Rewrite bullets to be ATS-friendly. Include keywords from the JD without stuffing; keep them readable."
    },
    {
      label: "Tighten + verbs",
      text: "Reduce fluff. Replace weak verbs with varied, strong ones. Keep each bullet result-first and under 2 lines."
    },
    {
      label: "Case study outline",
      text: "Outline a portfolio case study: context, constraints, process, decisions, results, and before/after metrics."
    },
    {
      label: "Interview stories",
      text: "Turn this experience into 2–3 PAR/STAR interview stories with clear situation, your actions, and results."
    },
  ],

  /* ————————————————  Planner (study/work)  ———————————————— */
  planner: [
    {
      label: "Task plan",
      text: "Break this goal into realistic tasks with buffers and a suggested schedule. Include risks and mitigations."
    },
    {
      label: "Weekly plan",
      text: "Create a weekly plan with prioritized tasks, realistic time estimates, and buffers."
    },
    {
      label: "Study plan",
      text: "Create a study plan using Pomodoro and spaced repetition. Include daily focus blocks and review cadence."
    },
    {
      label: "Exam countdown",
      text: "Make a week-by-week plan up to exam day: topics, practice tests, review days, and confidence checks."
    },
    {
      label: "Project roadmap",
      text: "Outline a project roadmap: milestones, owners, durations, and dependencies (text-based timeline)."
    },
    {
      label: "Risk register",
      text: "Create a short risk register: risk, likelihood, impact, mitigation, and early warning signs."
    },
    {
      label: "Daily schedule",
      text: "Design a balanced day: Deep Work blocks, admin windows, breaks, and 20% buffer for overruns."
    },
    {
      label: "Habits plan",
      text: "Create a habit tracker for 4–6 habits with cues, minimum standards, metrics, and weekly reflection."
    },
    {
      label: "Sprint plan",
      text: "Draft a 1–2 week sprint plan: top stories, points, owners, demo criteria, and an end-of-sprint retro prompt."
    },
    {
      label: "Budget plan",
      text: "Make a simple monthly personal finance plan: categories, % allocations, savings target, and 2 guardrails."
    },
    {
      label: "Fitness plan",
      text: "Create a 4-week beginner fitness plan: 3 workouts/week, progressive overload, and recovery guidance."
    },
    {
      label: "Reading plan",
      text: "Plan 30 days of reading: pages/day, note-taking method, and weekly synthesis checkpoints."
    },
    {
      label: "Morning routine",
      text: "Optimize a 45–90 minute morning routine for energy and focus (stacked habits + contingencies)."
    },
    {
      label: "Travel checklist",
      text: "Build a travel planning checklist with a timeline (T-30/T-14/T-7/T-1) and a day-of packing list."
    },
  ],
};
