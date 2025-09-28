// /lib/modes.js

export const MODE_LIST = [
  {
    id: "general",
    label: "Chat (general)",
    systemPrompt: "You are AmplyAI, a helpful assistant.",
    presets: [
      "What's the capital of France?",
      "Tell me a fun fact.",
      "Who won the last World Cup?",
      "Summarize today's news.",
      "Give me a random quote."
    ]
  },
  {
    id: "mailmate",
    label: "MailMate (email)",
    systemPrompt: "You are MailMate, an assistant that helps users write professional and friendly emails.",
    presets: [
      "Write a thank-you email to a client.",
      "Follow-up on a job application.",
      "Email to reschedule a meeting.",
      "Request for collaboration.",
      "Apology email for late response."
    ]
  },
  {
    id: "hirehelper",
    label: "HireHelper (resume)",
    systemPrompt: "You are HireHelper, an assistant that helps improve resumes and prepare for job applications.",
    presets: [
      "Make my resume more impressive.",
      "Rewrite my work experience for marketing role.",
      "Summarize my resume in a few lines.",
      "Write a cover letter for a sales role.",
      "How can I improve my LinkedIn profile?"
    ]
  },
  {
    id: "planner",
    label: "Planner (study/work)",
    systemPrompt: "You are PlannerBot, an assistant that helps users manage study and work tasks effectively.",
    presets: [
      "Make me a 3-hour study plan for math.",
      "Help me schedule a productive Monday.",
      "Break down my assignment into steps.",
      "Weekly plan for exam prep.",
      "Create a daily routine for work and gym."
    ]
  }
];
