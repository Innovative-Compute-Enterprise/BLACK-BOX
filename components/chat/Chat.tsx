// src/components/chat/Chat.tsx

'use client';

import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import MessageDisplay from './MessageDisplay';
import InputArea from './InputArea';
import ChatHeader from './subcomponents/buttonTopLeft';
import ChatHistoryDrawer from './subcomponents/drawerLeft';
import { ChatContext, ChatProvider } from '@/context/ChatContext';
import { createClient } from '@/utils/supabase/client';
import { Message, ChatHistory } from '@/types/chat';

const Chat: React.FC = () => {
  const supabase = createClient();

  // State variables
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Context and refs
  const { model, setModel } = useContext(ChatContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to load chat from history
  const loadChatFromHistory = useCallback((id: string) => {
    setCurrentSessionId(id);
  }, []);

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
  }, []);

  // Function to toggle the settings modal
  const toggleSettings = useCallback(() => {
    setIsSettingsOpen((prev) => !prev);
  }, []);

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

  // Fetch chat history when the current chat ID changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (currentSessionId) {
        try {
          // Fetch the messages for the current chat session
          const response = await fetch(`/api/chat?sessionId=${currentSessionId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const { messages: fetchedMessages, error } = await response.json();

          if (error) {
            console.error('Error fetching chat history:', error);
            // Optionally, handle the error in the UI
          } else {
            setMessages(fetchedMessages);
          }
        } catch (err) {
          console.error('Fetch error:', err);
          // Optionally, handle the fetch error in the UI
        }
      } else {
        setMessages([]);
      }
    };

    fetchChatHistory();
  }, [currentSessionId]);

  // Fetch chat histories when userId changes
  useEffect(() => {
    fetchChatHistories();
  }, [fetchChatHistories]);

  // Function to handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (inputMessage.trim()) {
      if (!userId) {
        console.error('User is not authenticated');
        // Optionally, display a user-facing error message here
        return;
      } else if (!model) {
        console.error('Model is not selected');
        // Optionally, display a user-facing error message here
        return;
      }

      setIsSubmitting(true);

      try {
        // Send the user's message to the server
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: inputMessage,
            sessionId: currentSessionId,
            userId: userId,
            title: 'To-do',
            model,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Receive the updated session ID and messages from the server
        const { sessionId, messages: fetchedMessages, error } = await response.json();

        if (error) {
          console.error('Error:', error);
          // Optionally, handle the error in the UI
        } else {
          const isNewSession = !currentSessionId;
          if (isNewSession) {
            setCurrentSessionId(sessionId);
            // Refetch chat histories to include the new session
            await fetchChatHistories();
            console.log('New session created and chat histories refetched.');
          }
          setMessages(fetchedMessages);
          console.log('Messages updated:', fetchedMessages);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        // Optionally, handle the fetch error in the UI
      } finally {
        setInputMessage('');
        setIsSubmitting(false);
      }
    }
  }, [inputMessage, userId, model, currentSessionId, fetchChatHistories]);

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

  // ... rest of the component

  return (
    <div className="flex flex-col h-screen">
      {/* Chat header with drawer and settings toggles */}
      <ChatHeader
        isDrawerOpen={isDrawerOpen}
        toggleSettings={toggleSettings}
        toggleDrawer={toggleDrawer}
        handleNewChat={handleNewChat}
        aria-label="Toggle chat history drawer"
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
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-2xl flex flex-col">
            <div className="flex-1 overflow-y-auto py-24 px-4 w-full scrollbar-hide">
              {/* Display messages or a placeholder if there are no messages */}
              {messages.length > 0 ? (
                <MessageDisplay messages={messages} />
              ) : (
                <div className="text-center text-gray-500 mt-10">
                  No messages yet. Start the conversation!
                </div>
              )}
              {/* Reference to scroll into view */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area for new messages */}
            <div className="mt-auto w-full px-4">
              <InputArea
                input={inputMessage}
                setInput={setInputMessage}
                handleSendMessage={handleSendMessage}
                isSubmitting={isSubmitting}
                model={model}
                setModel={setModel}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap Chat component with ChatProvider context
const ChatWithProvider: React.FC = () => (
  <ChatProvider>
    <Chat />
  </ChatProvider>
);

export default React.memo(ChatWithProvider);