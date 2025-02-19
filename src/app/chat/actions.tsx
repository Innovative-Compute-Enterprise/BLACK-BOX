// src/app/chat/actions.ts
'use server'

import { createClient } from '@/utils/supabase/server';
import { handleSessionId, handlePost, handleChatDelete, handleChatEdit, handleChatSessionsGet } from '@/utils/chat/server'; // Import utility functions
import type { Message, ChatHistory, MessageContent } from '@/types/chat';

// Server Action to create a new chat session
export const createNewChatSessionAction = async (userId: string): Promise<{ sessionId: string }> => {
    const supabase = createClient();
    return handleSessionId({ userId, supabase });
};

// Server Action to handle sending a user message and getting AI response
export const sendMessageAction = async ({
    content,
    sessionId,
    userId,
    model
}: {
    content: string; // 
    sessionId: string | null;
    userId: string;
    model: string;
}): Promise<{ sessionId: string; message: Message }> => {
    const supabase = createClient();
    
    const messageContentArray: MessageContent[] = [{ type: 'text', text: content }]; // Wrap string in MessageContent array

    return handlePost({ content: messageContentArray, sessionId, userId, model, supabase }); // Pass the array
};

// New Server Actions for Fetching, Editing, and Deleting Sessions
export const fetchChatHistoriesAction = async (userId: string): Promise<{ histories: ChatHistory[] }> => {
    const supabase = createClient();
    return handleChatSessionsGet({ userId, supabase });
  };
  
  export const editChatSessionAction = async ({
    sessionId,
    userId,
    newTitle,
  }: {
    sessionId: string;
    userId: string;
    newTitle: string;
  }): Promise<{ chatHistory: ChatHistory }> => {
    const supabase = createClient();
    return handleChatEdit({ sessionId, userId, newTitle, supabase });
  };
  
  export const deleteChatSessionAction = async ({
    sessionId,
    userId,
  }: {
    sessionId: string;
    userId: string;
  }): Promise<{ success: boolean }> => {
    const supabase = createClient();
    return handleChatDelete({ sessionId, userId, supabase });
  };