// Groups of premade prompts to feed into ChatPanel via <PresetBar />
// Each item: { label: string, text: string }

const general = [
  {
    label: "Summarize",
    text: "Summarize this article: https://en.wikipedia.org/wiki/Artificial_intelligence",
  },
  {
    label: "Explain simply",
    text: "Explain simply how transformers work.",
  },
  {
    label: "Pros & cons",
    text: "List pros & cons of remote-first teams for a 10-person startup.",
  },
  {
    label: "Action steps",
    text: "Give me action steps to launch a landing page in 48 hours.",
  },
];

const mailmate = [
  {
    label: "Follow-up email",
    text: "Draft a polite follow-up email about the proposal I sent last week. Friendly, 120–150 words, clear CTA for a 20-min call.",
  },
  {
    label: "Subject A/B",
    text: "Write 5 subject line options for a product update email—tone: curious, not salesy.",
  },
  {
    label: "Summarize email",
    text: "Summarize this long email into 3 bullets and 1 clear decision: <paste here>.",
  },
  {
    label: "Rewrite politely",
    text: 'Rewrite this email to sound more confident but still kind: "We cannot proceed until you pay the invoice."',
  },
];

const hirehelper = [
  {
    label: "Extract reqs",
    text: "Extract the top 8 requirements from this job post and map them to resume bullets for a PM role: <paste JD here>.",
  },
  {
    label: "Metric bullet",
    text: "Rewrite this bullet to be results-first with metrics: 'managed onboarding for new clients'.",
  },
  {
    label: "Summary (DA)",
    text: "Tailor my resume summary for a data analyst role focused on SQL + dashboards (80–100 words).",
  },
  {
    label: "STAR bullets",
    text: "Turn these raw notes into 4 resume bullets using the STAR method: <paste notes here>.",
  },
];

const planner = [
  {
    label: "Deep-work plan",
    text: "Make me a 2-hour deep-work schedule for tomorrow morning on research synthesis (Pomodoro 50/10, 2 cycles, include break tasks).",
  },
  {
    label: "Study week",
    text: "Create a weekly study plan for data structures: 5 days, 45m/day, goal = nail binary trees & graphs.",
  },
  {
    label: "Sequence todos",
    text: 'Turn this todo list into a sequence with estimates: "draft outline, gather 10 sources, write intro, edit".',
  },
  {
    label: "Calendar blocks",
    text: "Turn that plan into calendar blocks for next week (weekday evenings).",
  },
];

const focus = [
  { label: "Block tmr 2–4pm", text: "block 2-4pm tomorrow — Deep Work thesis" },
  { label: "Next Wed 14:30", text: "next wed 14:30 call with supplier" },
  { label: "All-day tmr", text: "all day tomorrow: study retreat" },
  { label: "Range Fri 7–9", text: "this fri 7pm-9pm dinner with family" },
];

const presets = { general, mailmate, hirehelper, planner, focus };
export default presets;
