// components/ChatPanel.jsx
import { track } from "@/lib/analytics";

// when switching tabs -> in pages/app.js where setTab runs:
onClick={() => { setTab(key); track("tab_select", { tab: key }); }}

// inside ChatPanel.jsx -> after the user submits:
track("message_send", { tab: tabId });

// on error:
setError("Something went wrong. Please try again.");
track("error", { tab: tabId });

// feedback buttons:
const handleFeedback = (id, isUp) => {
  track("feedback_vote", { tab: tabId, vote: isUp ? "up" : "down" });
};
