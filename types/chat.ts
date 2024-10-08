// types/chat.ts

export interface Message {
  id: string;
  content: string;
  displayedContent?: string; // New field for typing animation
  role: 'user' | 'assistant';
  pending?: boolean; // New flag to indicate pending messages

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
  setModel: React.Dispatch<React.SetStateAction<string | null>>;
}
