// Groups of premade prompts to feed into ChatPanel via <PresetBar />
// Each item: { label: string, text: string }

const general = [
  { label: "Summarize", text: "Summarize this article: https://en.wikipedia.org/wiki/Artificial_intelligence" },
  { label: "Explain simply", text: "Explain simply how transformers work." },
  { label: "Pros & cons", text: "List pros & cons of remote-first teams for a 10-person startup." },
  { label: "Action steps", text: "Give me action steps to launch a landing page in 48 hours." },
  { label: "Brainstorm 10", text: "Brainstorm 10 content ideas for a developer tools blog aimed at PMs." },
  { label: "Clarify problem", text: "Ask me 8 clarification questions to understand my idea for an AI note app." },
  { label: "Rewrite shorter", text: "Rewrite this paragraph to be 40% shorter and clearer: <paste here>." },
  { label: "Outline doc", text: "Draft an outline for a 1-pager pitching a new customer-feedback pipeline." },
  { label: "Meeting notes", text: "Turn these messy notes into clean bullets with decisions + owners: <paste>." },
  { label: "Next steps", text: "Given this context, suggest next 5 steps with estimates: <paste context>." },
];

const mailmate = [
  { label: "Follow-up email", text: "Draft a polite follow-up email about the proposal I sent last week. Friendly, 120–150 words, clear CTA for a 20-min call." },
  { label: "Subject A/B", text: "Write 5 subject line options for a product update email—tone: curious, not salesy." },
  { label: "Summarize email", text: "Summarize this long email into 3 bullets and 1 clear decision: <paste here>." },
  { label: "Rewrite politely", text: 'Rewrite this email to sound more confident but still kind: "We cannot proceed until you pay the invoice."' },
  { label: "Cold outreach", text: "Draft a short cold email to a Head of Data about our analytics tool. 90–120 words, value-first, no fluff." },
  { label: "Chase invoice", text: "Write a friendly invoice reminder (net 30, 10 days overdue), include link placeholder and offer help." },
  { label: "Decline gently", text: "Write a courteous decline to a partnership offer while keeping the door open for future chats." },
  { label: "Calendar ask", text: "Draft a reply proposing 3 time slots next week for a 20-min call. Include timezone and Google Meet." },
  { label: "Feedback ask", text: "Ask for feedback after a pilot, 4 short questions and thank-you, friendly tone." },
  { label: "Job intro", text: "Ask for an intro to a hiring manager for the <role> position—brief, respectful, low pressure." },
];

const hirehelper = [
  { label: "Extract reqs", text: "Extract the top 8 requirements from this job post and map them to resume bullets for a PM role: <paste JD here>." },
  { label: "Metric bullet", text: "Rewrite this bullet to be results-first with metrics: 'managed onboarding for new clients'." },
  { label: "Summary (DA)", text: "Tailor my resume summary for a data analyst role focused on SQL + dashboards (80–100 words)." },
  { label: "STAR bullets", text: "Turn these raw notes into 4 resume bullets using the STAR method: <paste notes here>." },
  { label: "Portfolio plan", text: "Suggest a 2-week plan to build a small portfolio for <role> with 3 concrete projects." },
  { label: "ATS keywords", text: "Extract ATS keywords from this JD and show which ones my resume is missing: <paste JD>, <paste resume>." },
  { label: "Cover letter", text: "Draft a focused cover letter (150–180 words) for <company> <role>, using my top 3 achievements: <paste>." },
  { label: "Interview Qs", text: "Create 10 targeted interview questions for <role> and a short cheat-sheet for answers." },
  { label: "Gap explainer", text: "Write a brief, positive explanation for a 6-month employment gap (learning, freelancing, family)." },
  { label: "Ref message", text: "Draft a LinkedIn DM asking for a referral at <company> for <role>, friendly and concise." },
];

const planner = [
  { label: "Deep-work plan", text: "Make me a 2-hour deep-work schedule for tomorrow morning on research synthesis (Pomodoro 50/10, 2 cycles, include break tasks)." },
  { label: "Study week", text: "Create a weekly study plan for data structures: 5 days, 45m/day, goal = nail binary trees & graphs." },
  { label: "Sequence todos", text: 'Turn this todo list into a sequence with estimates: "draft outline, gather 10 sources, write intro, edit".' },
  { label: "Calendar blocks", text: "Turn that plan into calendar blocks for next week (weekday evenings)." },
  { label: "Task plan", text: "Break this large task into steps with durations and dependencies: <paste task>." },
  { label: "Weekly plan", text: "Plan my next 7 days: gym (3x), study (5x 45m), family (Fri night), errands (Sun). Output as a table." },
  { label: "Study plan", text: "Design a 4-week study plan for Python basics to pandas—5 sessions/week, each 60 minutes." },
  { label: "Exam countdown", text: "Exam in 21 days. Make a daily countdown plan with revisits and 3 timed mocks." },
  { label: "Project roadmap", text: "Draft a 6-week roadmap for an MVP launch (week-by-week milestones, risks, owners)." },
  { label: "Risk register", text: "Create a risk register for MVP launch with likelihood, impact, and mitigations." },
];

const focus = [
  { label: "Block tmr 2–4pm", text: "block 2-4pm tomorrow — Deep Work thesis" },
  { label: "Next Wed 14:30", text: "next wed 14:30 call with supplier" },
  { label: "All-day tmr", text: "all day tomorrow: study retreat" },
  { label: "Range Fri 7–9", text: "this fri 7pm-9pm dinner with family" },
  { label: "Standup 9:30", text: "every weekday 9:30am for 15m — standup" },
  { label: "1:1 Tue", text: "first Tue next month 3pm for 45m — 1:1 with manager" },
  { label: "Workout", text: "mon/wed/fri 7am-8am — gym" },
  { label: "Dentist", text: "dec 3 10am dentist checkup for 30m" },
  { label: "Flight", text: "nov 12 6am-9am flight to LAX" },
  { label: "Focus sprint", text: "block today 90m — focus sprint: fix flaky tests" },
];

const presets = { general, mailmate, hirehelper, planner, focus };
export default presets;
