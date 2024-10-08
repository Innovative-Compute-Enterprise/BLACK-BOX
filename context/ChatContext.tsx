// src/context/ChatContext.tsx
import React, { createContext, useState, ReactNode } from 'react';

interface ChatContextProps {
  model: string;
  setModel: (model: string) => void;
}

export const ChatContext = createContext<ChatContextProps>({
  model: 'gpt-4o-mini', // Set a default model
  setModel: () => {},
});

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [model, setModel] = useState<string>('gpt-4o-mini'); // Initialize with default

  return (
    <ChatContext.Provider value={{ model, setModel }}>
      {children}
    </ChatContext.Provider>
  );
};
