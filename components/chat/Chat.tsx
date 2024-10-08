// components/Chat.tsx
'use client';

import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import MessageDisplay from './MessageDisplay';
import InputArea from './InputArea';
import ChatHeader from './subcomponents/buttonTopLeft';
import ChatHistoryDrawer from './subcomponents/drawer/drawerLeft';
import { ChatContext, ChatProvider } from '@/context/ChatContext';
import { createClient } from '@/utils/supabase/client';
import { Message, ChatHistory } from '@/types/chat';
import { useRouter } from 'next/navigation'; 
import NoMessages from './subcomponents/noMessages';

interface ChatProps {
  sessionId?: string;
}

const Chat: React.FC<ChatProps> = ({ sessionId }) => {
  const supabase = createClient();
  const router = useRouter();

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isModelLocked, setIsModelLocked] = useState<boolean>(false);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Context and refs
  const { model, setModel } = useContext(ChatContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to load chat from history
  const loadChatFromHistory = useCallback(
    (id: string) => {
      setCurrentSessionId(id);
      router.push(`/chat/${id}`); 
    },
    [router]
  );

  // Lock model selection if the chat session already exists
  useEffect(() => {
    if (currentSessionId) {
      setIsModelLocked(true); // Lock the model if there's an existing session
    } else {
      setIsModelLocked(false); // Unlock the model for new chats
    }
  }, [currentSessionId]);

  // Retrieve the authenticated user's ID on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error.message);
      } else {
        setUserId(data.user?.id || null);
      }
    };

    getUser();

    // Listen for authentication state changes to update userId accordingly
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    // Clean up the subscription on component unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // Scroll to the bottom of messages when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to toggle the chat history drawer
  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  // Function to start a new chat session
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setIsModelLocked(false); // Unlock model selection for new chat
    setModel('gpt-4o-mini'); // Optionally reset model to default
    router.push('/chat'); // Navigate to the chat page without a sessionId
  }, [router, setModel]);

  // Encapsulate fetchChatHistories in useCallback
  const fetchChatHistories = useCallback(async () => {
    if (userId) {
      try {
        const response = await fetch(`/api/chat-sessions?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { histories, error } = await response.json();

        if (error) {
          console.error('Error fetching chat histories:', error);
          // Optionally, handle the error in the UI
        } else {
          setChatHistories(histories);
          console.log('Fetched chat histories:', histories);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        // Optionally, handle the fetch error in the UI
      }
    } else {
      setChatHistories([]); // Ensure chatHistories is an empty array
    }
  }, [userId]);

  // Fetch chat history when the current chat ID and userId change
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (currentSessionId && userId) {
        try {
          // Fetch the messages and model for the current chat session
          const response = await fetch(`/api/chat?sessionId=${currentSessionId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const { messages: fetchedMessages, model: sessionModel, error } = await response.json();

          if (error) {
            console.error('Error fetching chat history:', error);
          } else {
            // Process fetched messages to set displayedContent for historical messages
            const processedMessages: Message[] = fetchedMessages.map((msg: Message) => ({
              ...msg,
              displayedContent: msg.role === 'assistant' ? msg.content : msg.content,
              pending: false, // Ensure no pending flag for historical messages
            }));

            setMessages(processedMessages);

            // Update the model in context to the model from the session
            if (sessionModel) {
              setModel(sessionModel);
            }

            setIsModelLocked(true); // Lock the model selector
          }
        } catch (err) {
          console.error('Fetch error:', err);
        }
      } else {
        setMessages([]);
        setIsModelLocked(false); // Unlock the model selector for new chats
      }
    };

    fetchChatHistory();
  }, [currentSessionId, userId, setModel]);

  // Fetch chat histories when userId changes
  useEffect(() => {
    fetchChatHistories();
  }, [fetchChatHistories]);

  // Function to handle sending a message
  const handleSendMessage = useCallback(
    async () => {
      console.log('handleSendMessage called with:', { inputMessage, currentSessionId, userId, model });
      if (inputMessage.trim()) {
        if (!userId) {
          console.error('User is not authenticated');
          return;
        } else if (!model) {
          console.error('Model is not selected');
          return;
        }

        const userMessage: Message = {
          id: `user-${Date.now()}`, // Generate a unique ID
          content: inputMessage,
          role: 'user',
          displayedContent: inputMessage, // Display immediately
        };

        const loadingMessage: Message = {
          id: `assistant-${Date.now()}`,
          content: '', // Will be filled by the AI
          displayedContent: '', // For typing animation
          role: 'assistant',
          pending: true, // Indicates that this message is loading
        };

        // Optimistically update the messages state
        setMessages((prevMessages) => [...prevMessages, userMessage, loadingMessage]);

        setIsSubmitting(true);
        console.log('Sending message to server:', { inputMessage, currentSessionId, userId, model });
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: inputMessage,
              sessionId: currentSessionId,
              userId,
              model: currentSessionId ? undefined : model,
            }),
          });

          if (!response.ok) {
            console.error('HTTP response not OK:', response.status);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const { sessionId, messages: fetchedMessages, error } = await response.json();
          console.log('Received from server:', { sessionId, fetchedMessages });

          if (error) {
            console.error('Error in handleSendMessage:', error);
          } else {
            const isNewSession = !currentSessionId;
            if (isNewSession) {
              setCurrentSessionId(sessionId);
              router.push(`/chat/${sessionId}`);
              await fetchChatHistories();
            }

            // Process fetched messages for typing animation
            const processedFetchedMessages: Message[] = fetchedMessages.map((msg: Message) => ({
              ...msg,
              displayedContent: msg.role === 'assistant' ? '' : msg.content, // Initialize as empty for AI
              pending: msg.role === 'assistant' ? false : msg.pending, // Ensure pending is false for fetched messages
            }));

            setMessages((prevMessages) => {
              // Remove the last message (loadingMessage)
              const updatedMessages = prevMessages.slice(0, -1);
              // Add the fetched messages
              return [...updatedMessages, ...processedFetchedMessages];
            });
          }
        } catch (err) {
          console.error('Fetch error in handleSendMessage:', err);
          // Optionally, handle the error in the UI (e.g., remove loadingMessage or show an error)
        } finally {
          setInputMessage('');
          setIsSubmitting(false);
        }
      } else {
        console.log('Input message was empty after trimming.');
      }
    },
    [inputMessage, userId, model, currentSessionId, fetchChatHistories, router]
  );

  /**
   * Handler to edit a chat's title.
   * @param id - The ID of the chat to edit.
   * @param newTitle - The new title for the chat.
   */
  const onEditChat = useCallback(
    async (id: string, newTitle: string) => {
      if (!userId) {
        console.error('User is not authenticated');
        // Optionally, display a user-facing error message here
        return;
      }

      try {
        const response = await fetch('/api/chat-sessions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            title: newTitle,
            userId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { chatHistory, error } = await response.json();

        if (error) {
          console.error('Error updating chat title:', error);
        } else {
          setChatHistories((prevHistories) =>
            prevHistories.map((chat) =>
              chat.id === id ? { ...chat, title: newTitle } : chat
            )
          );
          console.log('Chat title updated:', chatHistory);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    },
    [userId]
  );

  /**
   * Handler to delete a chat.
   * @param id - The ID of the chat to delete.
   */
  const onDeleteChat = useCallback(
    async (id: string) => {
      if (!userId) {
        console.error('User is not authenticated');
        // Optionally, display a user-facing error message here
        return;
      }

      try {
        const response = await fetch(`/api/chat-sessions/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { success, error } = await response.json();

        if (error) {
          console.error('Error deleting chat:', error);
        } else if (success) {
          setChatHistories((prevHistories) =>
            prevHistories.filter((chat) => chat.id !== id)
          );

          if (currentSessionId === id) {
            setCurrentSessionId(null);
            setMessages([]);
          }
          console.log('Chat deleted successfully:', id);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    },
    [userId, currentSessionId]
  );

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader
        model={model}
        setModel={setModel}
        isDrawerOpen={isDrawerOpen}
        toggleDrawer={toggleDrawer}
        handleNewChat={handleNewChat}
        isModelLocked={isModelLocked}        
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat history drawer */}
        <ChatHistoryDrawer
          onEditChat={onEditChat}
          onDeleteChat={onDeleteChat}
          isDrawerOpen={isDrawerOpen}
          chatHistories={chatHistories}
          loadChatFromHistory={loadChatFromHistory}
          currentSessionId={currentSessionId}
        />

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {messages.length > 0 ? (
              <MessageDisplay messages={messages} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <NoMessages />
              </div>
            )}
          </div>

          {/* Input area for new messages */}
          <div className="p-4">
            <InputArea
              input={inputMessage}
              setInput={setInputMessage}
              handleSendMessage={handleSendMessage}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface ChatWithProviderProps {
  sessionId?: string;
}

const ChatWithProvider: React.FC<ChatWithProviderProps> = ({ sessionId }) => (
  <ChatProvider>
    <Chat sessionId={sessionId} />
  </ChatProvider>
);

export default React.memo(ChatWithProvider);
