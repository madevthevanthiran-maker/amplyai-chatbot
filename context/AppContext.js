import { createContext, useContext, useState } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("general");

  return (
    <AppContext.Provider value={{ messages, setMessages, mode, setMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
