// lib/modes.js

export const MODE_LIST = [
  { id: "general",   label: "Chat (general)" },
  { id: "mailmate",  label: "MailMate (email)" },
  { id: "hirehelper",label: "HireHelper (resume)" },
  { id: "planner",   label: "Planner (study/work)" },
];

export const PRESETS_BY_MODE = {
  general: [ /* ... your general presets ... */ ],
  mailmate: [ /* ... your mailmate presets ... */ ],
  hirehelper: [ /* ... your hirehelper presets ... */ ],
  planner: [ /* ... your planner presets ... */ ]
};

// 👇 Fix: Alias export so ChatPanel can import as `PRESETS`
export const PRESETS = PRESETS_BY_MODE;
