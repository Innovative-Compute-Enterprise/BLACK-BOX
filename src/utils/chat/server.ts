// server.ts
'use server';

import { Message, ChatHistory, MessageContent } from '@/src/types/chat';
import { SupabaseClient } from '@supabase/supabase-js';
import { cortex } from '@/src/lib/ai/cortex';
import { generateChatTitle } from '@/src/lib/ai/cortex.server';
import { randomUUID } from 'crypto';

const chatCortex = cortex();

export async function handleSessionId({
  userId,
  supabase,
}: {
  userId: string;
  supabase: SupabaseClient;
}): Promise<{ sessionId: string; chatHistory: ChatHistory }> {
  const { data: sessionData, error: sessionError } = await supabase
    .from('chat_sessions')
    .insert([{ user_id: userId }])
    .select()
    .single();

  if (sessionError) {
    throw sessionError;
  }
  
  // Create a chat history object to return to the client
  const chatHistory: ChatHistory = {
    id: sessionData.id,
    title: 'New Chat',
    created_at: sessionData.created_at,
    updated_at: sessionData.created_at // Initially, updated_at equals created_at
  };
  
  return { 
    sessionId: sessionData.id,
    chatHistory
  };
}

export async function handlePost({
  content,
  sessionId,
  userId,
  model,
  supabase,
  context,
  files,
  capabilities,
}: {
  content: MessageContent[];
  model: string;
  sessionId: string | null;
  userId: string;
  supabase: SupabaseClient;
  context?: any[];
  files?: any[];
  capabilities?: {
    webSearch?: boolean;
    customInstructions?: string;
  };
}): Promise<{ sessionId: string; message: Message; titleUpdated?: boolean }> {
  console.log('Starting handlePost function with input:', { 
    contentLength: content.length, 
    sessionId, 
    userId, 
    model, 
    hasContext: context && context.length > 0,
    hasFiles: files && files.length > 0,
    capabilities: {
      webSearch: capabilities?.webSearch,
      hasCustomInstructions: !!capabilities?.customInstructions
    }
  });

  if (!sessionId) {
    throw new Error('Session ID is required to post a message.');
  }

  try {

        // Extract text from content for potential auto-search
        const textContent = content
        .filter(item => item.type === 'text')
        .map(item => (item as { text: string }).text)
        .join(' ');

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

    let thread = chatData?.messages || [];
    let selectedModel = chatData?.model || model;

    // Create a user message with files attached
    const userMessage: Message = { 
      id: randomUUID(), 
      role: 'user', 
      content,
      createdAt: Date.now()
    };
    
    // Explicitly attach files to the message if they exist
    if (files && files.length > 0) {
      console.log(`Attaching ${files.length} files to message`);
      userMessage.files = files;
    }
    
    thread.push(userMessage);

    const isWebSearchEnabled = capabilities?.webSearch === true;

    // Auto-search if appropriate
    let webSearchData = null;
    if (isWebSearchEnabled && textContent) {
      try {
        console.log('[SEARCH_DEBUG] Web search is enabled, performing search for:', textContent.substring(0, 30) + '...');
        webSearchData = await chatCortex.performSearch(textContent, thread);
        console.log(`[SEARCH_DEBUG] Search results:`, {
          query: webSearchData.query,
          resultsCount: webSearchData.results?.length || 0,
          timestamp: webSearchData.timestamp
        });
      } catch (searchError) {
        console.error('[SEARCH_DEBUG] Error during web search:', searchError);
      }
    } else {
      console.log('[SEARCH_DEBUG] Web search not performed:', { 
        isEnabled: isWebSearchEnabled, 
        hasTextContent: !!textContent 
      });
    }

    console.log(`[SEARCH_DEBUG] Sending to ${selectedModel}:`, {
      messagesCount: thread.length,
      lastUserMessage: thread[thread.length-1].content.map(c => 
        c.type === 'text' ? c.text.substring(0, 30) + '...' : c.type),
      contextCount: context ? context.length : 0,
      webSearchResults: webSearchData ? webSearchData.results.length : 0,
      webSearchEnabled: isWebSearchEnabled
    });

    const modelHandler = chatCortex.getModelHandler(selectedModel); 
    if (!modelHandler) {
      console.error('No handler for model:', selectedModel);
      throw new Error(`Unsupported model: ${selectedModel}`);
    }
    
    // Get the system prompt from the model
    let systemPrompt = chatCortex.getSystemPrompt({ selectedChatModel: selectedModel });
    
    // Override with client-provided custom instructions if available
    if (capabilities?.customInstructions) {
      // Extract the standard cortex preamble
      const cortexPart = systemPrompt.split('\n\n')[0];
      
      // Replace the second part (custom instructions) with what was provided by the client
      systemPrompt = `${cortexPart}\n\n${capabilities.customInstructions}`;
      
      console.log('[PROMPT_DEBUG] Using client-provided custom instructions');
    }

    // Get TimeAndDate data from cortex
    const contextData = chatCortex.getContextData();

    // Log the system prompt for debugging
    console.log('[PROMPT_DEBUG] System prompt:', {
      modelId: selectedModel,
      promptLength: systemPrompt.length,
      promptStart: systemPrompt.substring(0, 100) + '...',
      promptEnd: '...' + systemPrompt.substring(systemPrompt.length - 100),
      fullPrompt: systemPrompt
    });

    if (webSearchData && webSearchData.results && webSearchData.results.length > 0) {
      // Transform results into the expected 'web_search_result' format
      const searchResultsContext = webSearchData.results.map(result => ({
        type: 'web_search_result',
        title: result.title || 'Search Result',
        snippet: result.snippet || 'No description available',
        url: result.url || 'https://www.google.com'
      }));
      
      // Log exact format of search results for debugging
      console.log('[SEARCH_DEBUG] First search result being added to context:', 
        JSON.stringify(searchResultsContext[0], null, 2));
      
      // Add to context or create new context array
      if (context) {
        context = [...context, ...searchResultsContext];
      } else {
        context = searchResultsContext;
      }
    }
    
    // Combine user-provided context with system context data
    const combinedContext = context ? [...context, contextData] : [contextData];

    // Log detailed context structure
    console.log('[CONTEXT_STRUCTURE] Context structure being passed to model handler:', {
      combinedContextLength: combinedContext.length,
      systemContextData: JSON.stringify(contextData),
      contextTypes: combinedContext.map(item => {
        if (item.type === 'web_search_result') {
          return `web_search_result: ${item.title}`;
        } else if (item.TimeAndDate) {
          return 'TimeAndDate';
        } else {
          return item.type || 'unknown';
        }
      })
    });

    // Add specific WebSearch info to contextData
    contextData.WebSearch = {
      ...contextData.WebSearch,
      available: isWebSearchEnabled,
      performed: isWebSearchEnabled && !!webSearchData,
      resultsFound: webSearchData?.results?.length > 0,
      query: webSearchData?.query || textContent
    };

    console.log('[CONTEXT_DEBUG] Context information:', {
      userContextProvided: !!context,
      userContextItems: context ? context.length : 0,
      userContextTypes: context ? context.map(item => item.type || 'unknown').join(', ') : 'none',
      combinedContextLength: combinedContext.length,
      firstUserContextItem: context && context.length > 0 ? 
        `Type: ${context[0].type}, Title: ${context[0].title?.substring(0, 30) || 'N/A'}` : 'none',
      systemContextData: Object.keys(contextData)
    });

    // Log full context example for debugging if web search results exist
    if (context && context.some(item => item.type === 'web_search_result')) {
      const webSearchResults = context.filter(item => item.type === 'web_search_result');
      console.log(`[CONTEXT_DEBUG] Found ${webSearchResults.length} web search results in context`);
      if (webSearchResults.length > 0) {
        console.log('[CONTEXT_DEBUG] First web search result example:', JSON.stringify(webSearchResults[0], null, 2));
      }
    }

    // Generate response from the assistant
    console.log('[CONTEXT_DEBUG] Calling model handler with context');
    const assistantMessage = await modelHandler(thread, systemPrompt, combinedContext, files);
    console.log('[CONTEXT_DEBUG] Received response from model handler');
    thread.push(assistantMessage);

    let titleUpdated = false;

    if (!chatData) {
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
        ])
        .select();

      if (insertError) {
        console.error('Error inserting new chat:', insertError.message);
        throw insertError;
      }
      
      titleUpdated = true;
    } else {
      // If this is the first message exchange (just 2 messages in the thread), generate a title
      if (thread.length === 2) {
        const generatedTitle = await generateChatTitle(thread);
        const { error: updateError } = await supabase
          .from('chats')
          .update({ 
            title: generatedTitle,
            messages: thread, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', chatData.id);

        if (updateError) {
          console.error('Error updating chat:', updateError.message);
          throw updateError;
        }
        
        titleUpdated = true;
      } else {
        // Regular update without changing the title
        const { error: updateError } = await supabase
          .from('chats')
          .update({ 
            messages: thread, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', chatData.id);

        if (updateError) {
          console.error('Error updating chat:', updateError.message);
          throw updateError;
        }
      }
    }

    console.log('handlePost function completed successfully');
    return { 
      sessionId: sessionId, 
      message: assistantMessage,
      titleUpdated
    };
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
    const chatHistory = chats.flatMap((chat: any) => {
      // Ensure each message has required properties
      return (chat.messages || []).map((message: Message) => {
        // If the message has files, make sure they're properly included
        if (message.files && message.files.length > 0) {
          console.log(`[handleGet] Message ${message.id} has ${message.files.length} attached files`);
        }
        
        // Ensure message has a createdAt property
        if (!message.createdAt) {
          message.createdAt = Date.now();
        }
        
        return message;
      });
    });
    
    const model = chats[0]?.model || null; // Use null if undefined

    console.log(`[handleGet] Retrieved ${chatHistory.length} messages for session ${sessionId}`);
    if (chatHistory.length > 0) {
      console.log(`[handleGet] First message: ${chatHistory[0].role}, Last message: ${chatHistory[chatHistory.length-1].role}`);
      
      // Log message with files
      const messagesWithFiles = chatHistory.filter(msg => msg.files && msg.files.length > 0);
      if (messagesWithFiles.length > 0) {
        console.log(`[handleGet] Found ${messagesWithFiles.length} messages with attached files`);
      }
    }

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
        updated_at: session.updated_at || session.created_at
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
      updated_at: new Date().toISOString() // Set updated_at to current time
    };

    return { chatHistory };
  } catch (error: any) {
    console.error('Error in handleChatEdit:', error);
    throw error;
  }
}