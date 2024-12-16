// utils/chat/queries.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { Message, ChatHistory } from '@/types/chat';

import { getModelHandler } from './llms';
import { generateUniqueId } from '../uniqueId';

/**
 * Creates a new chat session for a user.
 * @param userId - The ID of the user.
 * @param supabase - The Supabase client instance.
 * @returns An object containing the new session ID.
 */
export async function createSessionID(userId: string, supabase: SupabaseClient) {
  const { data: sessionData, error: sessionError } = await supabase
    .from('chat_sessions')
    .insert([{ user_id: userId }])
    .select()
    .single();

  if (sessionError) {
    console.error('Error creating chat session:', sessionError.message);
    throw sessionError;
  }

  console.log('New chat session created with ID:', sessionData.id);
  return { sessionId: sessionData.id };
}

/**
 * Fetches a chat session by its ID.
 * @param sessionId - The ID of the chat session.
 * @param supabase - The Supabase client instance.
 * @returns An object containing messages and the model used.
 */
export const getChatSession = cache(
  async (sessionId: string, supabase: SupabaseClient): Promise<{ messages: Message[]; model: string | null }> => {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    try {
      const { data: chats, error } = await supabase
        .from('chats')
        .select('messages, model')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      if (!chats || chats.length === 0) {
        // No chat data found for the provided sessionId
        // Return empty messages array and model as null
        return { messages: [], model: null };
      }

      // Flatten the messages from all chats
      const chatHistory = chats.flatMap((chat: any) => chat.messages);
      const model = chats[0]?.model || null; // Use null if undefined

      return { messages: chatHistory, model: model };
    } catch (error: any) {
      console.error('Error in getChatSession:', error);
      throw error;
    }
  }
);

/**
 * Fetches all chat histories for a specific user.
 * @param userId - The ID of the user.
 * @param supabase - The Supabase client instance.
 * @returns An object containing an array of chat histories.
 */
export const getChatHistories = cache(async (
  userId: string, 
  supabase: SupabaseClient
): Promise<{ 
  histories: ChatHistory[] 
}> => {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }
      // Fetch chat_sessions along with the latest chat's title
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          chats (
            title
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map sessions to include the latest chat's title
      const histories: ChatHistory[] = sessions.map((session: any) => {
        // Assuming 'chats' is an array of related chats
        const latestChat = session.chats && session.chats.length > 0 ? session.chats[0] : null;

        return {
          id: session.id,
          title: latestChat ? latestChat.title : 'Untitled Chat',
          created_at: session.created_at,
        };
      });

      return { histories };
    } catch (error: any) {
      console.error('Error in getChatHistories:', error);
      throw error;
    }
  }
);

/**
 * Handles sending a chat message within a session.
 * @param content - The content of the user's message.
 * @param model - The model to use for generating a response.
 * @param sessionId - The ID of the chat session.
 * @param userId - The ID of the user.
 * @param supabase - The Supabase client instance.
 * @returns An object containing the session ID and the assistant's message.
 */
export async function handleChatMessage(
  content: string,
  model: string,
  sessionId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<{ sessionId: string; message: Message }> {
  if (!sessionId) {
    throw new Error('Session ID is required to post a message.');
  }
  try {
    // Fetch the latest chat associated with the session
    const { data: chatData, error: chatFetchError } = await supabase
      .from('chats')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (chatFetchError) {
      console.error('Error fetching latest chat:', chatFetchError.message);
      throw chatFetchError;
    }

    // Initialize chat history and model
    let chatHistory = chatData?.messages || [];
    let selectedModel = chatData?.model || model;

    console.log('Using model:', selectedModel);

    // Add user's message to the history
    chatHistory.push({ id: generateUniqueId(), role: 'user', content });

    // Get the handler for the selected model
    const modelHandler = getModelHandler(selectedModel);
    if (!modelHandler) {
      console.error('No handler for model:', selectedModel);
      throw new Error(`Unsupported model: ${selectedModel}`);
    }

    // Generate the assistant's response
    const assistantMessage = await modelHandler(chatHistory);
    chatHistory.push(assistantMessage);

    // If no chatData exists, insert a new chat
    if (!chatData) {
      console.log('No previous chat data found, inserting a new chat.');
      const { error: insertError } = await supabase.from('chats').insert([
        {
          title: 'New Chat',
          user_id: userId,
          session_id: sessionId, // Use existing sessionId
          messages: chatHistory,
          model: selectedModel,
        },
      ]);

      if (insertError) {
        console.error('Error inserting new chat:', insertError.message);
        throw insertError;
      }
    } else {
      // If chat exists, update it with the new message
      const { error: updateError } = await supabase
        .from('chats')
        .update({ messages: chatHistory, updated_at: new Date().toISOString() })
        .eq('id', chatData.id);

      if (updateError) {
        console.error('Error updating chat:', updateError.message);
        throw updateError;
      }
    }

    console.log('handleChatMessage function completed successfully');
    return { sessionId: sessionId, message: assistantMessage };
  } catch (error: any) {
    console.error('Error in handleChatMessage:', error.message);
    throw error;
  }
}

/**
 * Handles deleting a chat session.
 * @param sessionId - The ID of the chat session to delete.
 * @param userId - The ID of the user.
 * @param supabase - The Supabase client instance.
 * @returns An object indicating success.
 */
export async function handleChatDelete(
  sessionId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<{ success: boolean }> {
  try {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    if (!userId) {
      throw new Error('userId is required');
    }
    // Verify that the session belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) {
      throw sessionError;
    }

    // Delete all chats associated with the session
    const { error: deleteChatsError } = await supabase.from('chats').delete().eq('session_id', sessionId);

    if (deleteChatsError) {
      throw deleteChatsError;
    }

    // Delete the chat session
    const { error: deleteSessionError } = await supabase.from('chat_sessions').delete().eq('id', sessionId);

    if (deleteSessionError) {
      throw deleteSessionError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in handleChatDelete:', error);
    throw error;
  }
}