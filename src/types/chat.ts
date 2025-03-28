// types/chat.ts
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent[];
  displayedContent?: string;
  pending?: boolean;
  createdAt: number;
  files?:   FileAttachment[];  
  processing?: boolean;  
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  mime_type: string;
  isImage: boolean;
}

export type MessageContent = 
  | { type: 'text', text: string }
  | { type: 'image_url', image_url: { url: string } }
  | { type: 'file_url', file_url: { url: string }, mime_type?: string, file_name?: string };

export interface ChatHistory {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface Model {
  id: string;
  name: string;
}

export interface ChatContextType {
  model: string | null;
  setModel: React.Dispatch<React.SetStateAction<string | null>>;
}


