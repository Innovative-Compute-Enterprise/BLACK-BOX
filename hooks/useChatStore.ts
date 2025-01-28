// hooks/useChatStore.ts
import { create } from 'zustand';
import { Message, ChatHistory } from '@/types/chat';

interface ChatState {
  messages: Message[];
  currentSessionId: string;
  chatHistories: ChatHistory[];
  isSubmitting: boolean;
  isInitialized: boolean;
  selectedFiles: File[];
}

interface ChatActions {
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setCurrentSessionId: (session: string) => void;
  setChatHistories: (histories: ChatHistory[]) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setIsInitialized: (isInitialized: boolean) => void;
  setSelectedFiles: (files: File[]) => void;
  resetState: () => void;
}

const initialState: ChatState = {
  messages: [],
  currentSessionId: null,
  chatHistories: [],
  isSubmitting: false,
  isInitialized: false,
  selectedFiles: []
};

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  ...initialState,
  setMessages: (messagesOrFn) => set((state) => ({
    messages: typeof messagesOrFn === 'function' ? messagesOrFn(state.messages) : messagesOrFn
  })),
  setCurrentSessionId: (session) => set({ currentSessionId: session }),
  setChatHistories: (histories) => set({ chatHistories: histories }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setIsInitialized: (isInitialized) => set({ isInitialized }),
  setSelectedFiles: (files) => set({ selectedFiles: files }),
  resetState: () => set(initialState)
}));