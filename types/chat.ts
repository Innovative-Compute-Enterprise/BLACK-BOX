// types/chat.ts

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

export interface ChatHistory {
  id: string;
  title?: string;
  created_at: string;
}

export interface Model {
  id: string;
  name: string;
}

export interface ChatContextType {
  model: string | null;
  setModel: (model: string) => void;
}