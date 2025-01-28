// server.ts

import { Message, ChatHistory, MessageContent } from '@/types/chat';
import { SupabaseClient } from '@supabase/supabase-js';
import { getModelHandler } from './llms';
import { generateChatTitle } from './llms'; 
import { randomUUID } from 'crypto';

// create SessionId
export async function handleSessionId({
  userId,
  supabase,
}: {
  userId: string;
  supabase: SupabaseClient;
}): Promise<{ sessionId: string }> {
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
  return { sessionId: sessionData.id }; // Garante que a criação do sessionId é feita aqui
}
// handle User reuqest
export async function handlePost({
  content,
  sessionId,
  userId,
  model,
  supabase,
}: {
  content: MessageContent[];
  model: string;
  sessionId: string | null;
  userId: string;
  supabase: SupabaseClient;
}): Promise<{ sessionId: string; message: Message }> {
  console.log('Starting handlePost function with input:', { content, sessionId, userId, model });

  // Verifica se o sessionId foi passado
  if (!sessionId) {
    throw new Error('Session ID is required to post a message.');
  }

  try {
    // Busca o chat mais recente associado à sessão
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

    // Inicializa o histórico de mensagens e o modelo
    let thread = chatData?.messages || [];
    let selectedModel = chatData?.model || model;

    console.log('Using model:', selectedModel);

    // Adiciona a mensagem do usuário ao histórico
    thread.push({ id: randomUUID(), role: 'user', content });

    // Obtenha o manipulador para o modelo selecionado
    const modelHandler = getModelHandler(selectedModel);
    if (!modelHandler) {
      console.error('No handler for model:', selectedModel);
      throw new Error(`Unsupported model: ${selectedModel}`);
    }

    // Gere a resposta do assistente
    const assistantMessage = await modelHandler(thread);
    thread.push(assistantMessage);

    // Se não houver chatData, significa que esta é a primeira mensagem, então insere um novo chat
    if (!chatData) {
      console.log('No previous chat data found, inserting a new chat.');

      const generatedTitle = await generateChatTitle(thread);

      const { error: insertError } = await supabase
        .from('chats')
        .insert([
          {
            title: generatedTitle,
            user_id: userId,
            session_id: sessionId, 
            messages: thread,
            model: selectedModel,
          },
        ]);

      if (insertError) {
        console.error('Error inserting new chat:', insertError.message);
        throw insertError;
      }
    } else {
      const { error: updateError } = await supabase
        .from('chats')
        .update({ messages: thread, updated_at: new Date().toISOString() })
        .eq('id', chatData.id);

      if (updateError) {
        console.error('Error updating chat:', updateError.message);
        throw updateError;
      }
    }

    console.log('handlePost function completed successfully');
    return { sessionId: sessionId, message: assistantMessage };
  } catch (error: any) {
    console.error('Error in handlePost:', error.message);
    throw error;
  }
}

export async function handleGet({
  sessionId,
  supabase,
}: {
  sessionId: string;
  supabase: SupabaseClient;
}): Promise<{ messages: Message[]; model: string | null }> {
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
    console.error('Error in handleGet:', error);
    throw error;
  }
}

export async function handleChatSessionsGet({
  userId,
  supabase,
}: {
  userId: string;
  supabase: SupabaseClient;
}): Promise<{ histories: ChatHistory[] }> {
  if (!userId) {
    throw new Error('userId is required');
  }

  try {
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
    console.error('Error in handleChatSessionsGet:', error);
    throw error;
  }
}

export async function handleChatDelete({
  sessionId,
  userId,
  supabase,
}: {
  sessionId: string;
  userId: string;
  supabase: SupabaseClient;
}): Promise<{ success: boolean }> {
  if (!sessionId) {
    throw new Error('sessionId is required');
  }

  if (!userId) {
    throw new Error('userId is required');
  }

  try {
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
    const { error: deleteChatsError } = await supabase
      .from('chats')
      .delete()
      .eq('session_id', sessionId);

    if (deleteChatsError) {
      throw deleteChatsError;
    }

    // Delete the chat session
    const { error: deleteSessionError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteSessionError) {
      throw deleteSessionError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in handleChatDelete:', error);
    throw error;
  }
}

export async function handleChatEdit({
  sessionId,
  userId,
  newTitle,
  supabase,
}: {
  sessionId: string;
  userId: string;
  newTitle: string;
  supabase: SupabaseClient;
}): Promise<{ chatHistory: ChatHistory }> {
  if (!sessionId) {
    throw new Error('sessionId is required');
  }

  if (!userId) {
    throw new Error('userId is required');
  }

  if (!newTitle) {
    throw new Error('newTitle is required');
  }

  try {
    // Verify that the session belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) {
      throw sessionError;
    }

    // Update the title of the latest chat associated with the session
    const { data: latestChat, error: latestChatError } = await supabase
      .from('chats')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestChatError) {
      throw latestChatError;
    }

    const { error: updateError } = await supabase
      .from('chats')
      .update({ title: newTitle })
      .eq('id', latestChat.id);

    if (updateError) {
      throw updateError;
    }

    const chatHistory: ChatHistory = {
      id: sessionId,
      title: newTitle,
      created_at: session.created_at,
    };

    return { chatHistory };
  } catch (error: any) {
    console.error('Error in handleChatEdit:', error);
    throw error;
  }
}