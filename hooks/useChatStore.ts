// hooks/useChatStore.ts
import { create } from 'zustand';
import { Message, ChatHistory } from '@/types/chat';

interface ChatStore {
  // State
  messages: Message[];
  currentSessionId: string | null;
  model: string;
  isModelLocked: boolean;
  isInitialized: boolean;
  chatHistories: ChatHistory[];

  // Actions
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setCurrentSessionId: (id: string | null) => void;
  setModel: (model: string) => void;
  setIsModelLocked: (locked: boolean) => void;
  setIsInitialized: (initialized: boolean) => void;
  setChatHistories: (histories: ChatHistory[]) => void;
  
  // Computed actions
  appendMessage: (message: Message) => void;
  updateLastMessage: (message: Partial<Message>) => void;
  removeLastMessage: () => void;
  resetChat: () => void;
}

const initialState = {
  messages: [],
  currentSessionId: null,
  model: 'gemini',
  isModelLocked: false,
  isInitialized: false,
  chatHistories: []
};

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  ...initialState,

  // Basic setters
  messages: [],
  setMessages: (messagesOrFn) => set((state) => ({
    messages: typeof messagesOrFn === 'function' 
      ? messagesOrFn(state.messages)
      : messagesOrFn
  })),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setModel: (model) => set({ model }),
  setIsModelLocked: (locked) => set({ isModelLocked: locked }),
  setIsInitialized: (initialized) => set({ isInitialized: initialized }),
  setChatHistories: (histories) => set({ chatHistories: histories }),

  // Computed actions
  appendMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message] 
    })),

  updateLastMessage: (messageUpdate) =>
    set((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;
      
      if (lastIndex >= 0) {
        messages[lastIndex] = {
          ...messages[lastIndex],
          ...messageUpdate
        };
      }
      
      return { messages };
    }),

  removeLastMessage: () =>
    set((state) => ({
      messages: state.messages.slice(0, -1)
    })),

  resetChat: () => set(initialState)
}));

// Optional: Selector hooks for better performance
export const useMessages = () => useChatStore((state) => state.messages);
export const useCurrentSession = () => useChatStore((state) => ({
  id: state.currentSessionId,
  model: state.model,
  isLocked: state.isModelLocked
}));