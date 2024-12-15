// context/ChatContext.tsx
'use client'

import React, { createContext, useState, useContext } from 'react';

interface ChatSession {
  id: string;
  title: string;
  model: string;
  lastUpdated: Date;
}

interface ChatContextType {
  // Session Management
  currentSession: ChatSession | null;
  setCurrentSession: (session: ChatSession | null) => void;
  
  // UI State
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  
  // App State
  isInitialized: boolean;
  setIsInitialized: (value: boolean) => void;
  
  // Model Settings
  model: string;
  setModel: (model: string) => void;
  isModelLocked: boolean;
  setIsModelLocked: (value: boolean) => void;
}

const initialState = {
  model: 'gemini',
  isDrawerOpen: false,
  isInitialized: false,
  isModelLocked: false,
  currentSession: null
};

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(initialState.currentSession);
  const [model, setModel] = useState(initialState.model);
  const [isDrawerOpen, setIsDrawerOpen] = useState(initialState.isDrawerOpen);
  const [isInitialized, setIsInitialized] = useState(initialState.isInitialized);
  const [isModelLocked, setIsModelLocked] = useState(initialState.isModelLocked);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  const contextValue = {
    // Session Management
    currentSession,
    setCurrentSession,
    
    // UI State
    isDrawerOpen,
    toggleDrawer,
    
    // App State
    isInitialized,
    setIsInitialized,
    
    // Model Settings
    model,
    setModel,
    isModelLocked,
    setIsModelLocked
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook with type safety
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

// Utility hook for session management
export const useSession = () => {
  const { currentSession, setCurrentSession } = useChatContext();
  
  const updateSession = (updates: Partial<ChatSession>) => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        ...updates,
        lastUpdated: new Date()
      });
    }
  };
  return {
    session: currentSession,
    updateSession,
    setSession: setCurrentSession
  };
};