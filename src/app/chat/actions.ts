// src/app/chat/actions.ts
'use server'

import { createClient } from '@/src/utils/supabase/server';
import { handleSessionId, handlePost, handleChatDelete, handleChatEdit, handleChatSessionsGet } from '@/src/utils/chat/server'; // Import utility functions
import type { Message, ChatHistory, MessageContent, FileAttachment } from '@/src/types/chat';

// Server Action to create a new chat session
export const createNewChatSessionAction = async (userId: string): Promise<{ sessionId: string; chatHistory: ChatHistory }> => {
    const supabase = await createClient();
    return handleSessionId({ userId, supabase });
};

// Server Action to handle sending a user message and getting AI response
export const sendMessageAction = async ({
  content,
  contextItems = [],
  fileAttachments = [],
  sessionId,
  userId,
  model,
  capabilities
}: {
  content: string;
  contextItems?: any[];
  fileAttachments?: FileAttachment[];
  sessionId: string | null;
  userId: string;
  model: string;
  capabilities?: {
    webSearch?: boolean;
    customInstructions?: string;
  };
}): Promise<{ sessionId: string; message: Message; titleUpdated?: boolean }> => {
  // Add logging for file attachments
  console.log(`[sendMessageAction] Processing message with ${fileAttachments?.length || 0} file attachments`);
  if (fileAttachments && fileAttachments.length > 0) {
    console.log('[sendMessageAction] File attachments:', fileAttachments.map(f => ({
      id: f.id,
      name: f.name,
      url: f.url,
      type: f.type
    })));
  }

  // Log if custom instructions were provided
  if (capabilities?.customInstructions) {
    console.log('[sendMessageAction] Custom instructions provided:', 
      capabilities.customInstructions.substring(0, 50) + '...');
  }

  const supabase = await createClient();
  
  // Create primary content from user input
  const messageContent: MessageContent[] = [{ type: 'text', text: content }];
  
  // Add file attachments to message content
  if (fileAttachments && fileAttachments.length > 0) {
    // Process file attachments into message content items
    const fileContentItems: MessageContent[] = fileAttachments.map(file => {
      if (file.isImage) {
        return {
          type: 'image_url',
          image_url: { url: file.url }
        } as MessageContent;
      } else {
        return {
          type: 'file_url',
          file_url: { url: file.url },
          mime_type: file.mime_type,
          file_name: file.name
        } as MessageContent;
      }
    });
    
    // Add file content items to message content
    messageContent.push(...fileContentItems);
  }
  
  // Add contextItems if provided (web search results)
  const context = contextItems.length > 0 ? contextItems : undefined;
  
  // Make sure to update the session's updated_at timestamp
  if (sessionId) {
    await supabase
      .from('chat_sessions')
      .update({ 
        updated_at: new Date().toISOString(),
        // Update the title if it's a new chat (content is the first user message)
        title: content.trim() ? content.substring(0, 50) : "New chat" 
      })
      .eq('id', sessionId);
  }
  
  try {
    // Call the server action to handle the message
    const result = await handlePost({ 
      content: messageContent, 
      context,
      files: fileAttachments, 
      sessionId, 
      userId, 
      model, 
      supabase,
      capabilities
    });
    
    console.log('[sendMessageAction] Message sent successfully with files');
    return result;
  } catch (error) {
    console.error('[sendMessageAction] Error sending message:', error);
    throw error;
  }
};

export const fetchChatHistoriesAction = async (userId: string): Promise<{ histories: ChatHistory[] }> => {
  const supabase = await createClient();
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
  const supabase = await createClient();
  return handleChatEdit({ sessionId, userId, newTitle, supabase });
};
  
export const deleteChatSessionAction = async ({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: string;
}): Promise<{ success: boolean }> => {
  const supabase = await createClient();
  return handleChatDelete({ sessionId, userId, supabase });
};