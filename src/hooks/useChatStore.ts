// hooks/useChatStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Message, ChatHistory } from '@/src/types/chat';

// Import or define the ProcessedFile type to match useFileUpload
interface ProcessedFile {
  originalFile: File;
  processedFile?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    mime_type: string;
    isImage: boolean;
  };
  isProcessing: boolean;
  error?: string;
}

interface ChatState {
  messages: Message[];
  currentSessionId: string | null;
  chatHistories: ChatHistory[];
  isSubmitting: boolean;
  isInitialized: boolean;
  selectedFiles: ProcessedFile[];
}

interface ChatActions {
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setCurrentSessionId: (session: string | null) => void;
  setChatHistories: (histories: ChatHistory[] | ((prev: ChatHistory[]) => ChatHistory[])) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setIsInitialized: (isInitialized: boolean) => void;
  setSelectedFiles: (files: ProcessedFile[] | ((prev: ProcessedFile[]) => ProcessedFile[])) => void;
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

export const useChatStore = create<ChatState & ChatActions>()(
  devtools(
    (set) => ({
      ...initialState,
      
      // Improved setters with immutable updates
      setMessages: (messagesOrFn) => 
        set(
          (state) => ({ 
            messages: typeof messagesOrFn === 'function' 
              ? messagesOrFn(state.messages) 
              : messagesOrFn 
          }),
          false,
          'setMessages'
        ),
        
      setCurrentSessionId: (sessionId) => 
        set({ currentSessionId: sessionId }, false, 'setCurrentSessionId'),
        
      setChatHistories: (historiesOrFn) => 
        set(
          (state) => ({
            chatHistories: typeof historiesOrFn === 'function'
              ? historiesOrFn(state.chatHistories)
              : historiesOrFn
          }),
          false,
          'setChatHistories'
        ),
        
      setIsSubmitting: (isSubmitting) => 
        set({ isSubmitting }, false, 'setIsSubmitting'),
        
      setIsInitialized: (isInitialized) => 
        set({ isInitialized }, false, 'setIsInitialized'),
        
      setSelectedFiles: (filesOrFn) => 
        set(
          (state) => ({
            selectedFiles: typeof filesOrFn === 'function'
              ? filesOrFn(state.selectedFiles)
              : filesOrFn
          }),
          false,
          'setSelectedFiles'
        ),
        
      resetState: () => set(initialState, false, 'resetState'),
    }),
    { name: 'chat-store' }
  )
);

// Selector functions to prevent unnecessary re-renders
export const useMessages = () => useChatStore((state) => state.messages);
export const useSetMessages = () => useChatStore((state) => state.setMessages);
export const useCurrentSessionId = () => useChatStore((state) => state.currentSessionId);
export const useSetCurrentSessionId = () => useChatStore((state) => state.setCurrentSessionId);
export const useChatHistories = () => useChatStore((state) => state.chatHistories);
export const useSetChatHistories = () => useChatStore((state) => state.setChatHistories);
export const useIsSubmitting = () => useChatStore((state) => state.isSubmitting);
export const useSetIsSubmitting = () => useChatStore((state) => state.setIsSubmitting);
export const useIsInitialized = () => useChatStore((state) => state.isInitialized);
export const useSetIsInitialized = () => useChatStore((state) => state.setIsInitialized);
export const useSelectedFiles = () => useChatStore((state) => state.selectedFiles);
export const useSetSelectedFiles = () => useChatStore((state) => state.setSelectedFiles);
export const useResetChatState = () => useChatStore((state) => state.resetState);