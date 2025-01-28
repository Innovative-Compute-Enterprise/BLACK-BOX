// types/chat.ts
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent[];
  displayedContent: string;
  pending?: boolean;
  createdAt: number;
  files?: File[];  
  processing?: boolean;  
}

export type MessageContent = 
  | { type: 'text', text: string }
  | { type: 'image_url', image_url: { url: string } };

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


