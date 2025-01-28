// src/app/actions.ts
'use server'; // Mark this as a Server Actions file

import { createClient } from '@/utils/supabase/server';
import { handleSessionId, handlePost } from '@/utils/chat/server'; // Import utility functions
import { Message, MessageContent } from '@/types/chat';

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
    content: string; // <--- ORIGINAL - Problematic: Expecting only string 
    sessionId: string | null;
    userId: string;
    model: string;
}): Promise<{ sessionId: string; message: Message }> => {
    const supabase = createClient();
    
    // **Corrected:** You need to create MessageContent array from the 'content' string
    const messageContentArray: MessageContent[] = [{ type: 'text', text: content }]; // Wrap string in MessageContent array

    return handlePost({ content: messageContentArray, sessionId, userId, model, supabase }); // Pass the array
};

// **Note:** You can add Server Actions for other utility functions- 
// (like `handleChatSessionsGet`, `handleChatDelete`, `handleChatEdit`) in this file if- 
// you need to call them directly from client components in the future to further optimize your app and reduce API routes.