// context/ChatContext.jsx

import { createContext, useContext, useState } from "react";
import { MODE_LIST, PRESETS_BY_MODE } from "@/lib/modes";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [selectedMode, setSelectedMode] = useState("general");
  const presets = PRESETS_BY_MODE[selectedMode] || [];

  return (
    <ChatContext.Provider value={{
      selectedMode,
      setSelectedMode,
      presets,
      modeList: MODE_LIST
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => useContext(ChatContext);
