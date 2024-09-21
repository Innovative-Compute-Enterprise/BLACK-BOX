// context/ChatContext.tsx

import React, { createContext, useState, ReactNode } from 'react';
import { ChatContextType } from '@/types/chat';

// Default values for the chat context
const defaultChatContext: ChatContextType = {
  model: null,
  setModel: () => {},
};

// Creates the chat context
export const ChatContext = createContext<ChatContextType>(defaultChatContext);

// Defines the properties for the chat provider component
interface ChatProviderProps {
  children: ReactNode;
}

// ChatProvider component to wrap around components that need access to the chat context
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [model, setModel] = useState<string | null>(null);

  return (
    <ChatContext.Provider value={{ model, setModel }}>
      {children}
    </ChatContext.Provider>
  );
};
