'use client';
import { generateUniqueId } from '@/utils/uniqueId';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from './useChatStore';
import { Message } from '@/types/chat';
import { useFileUpload } from './useFIleUpload';
import { useChatContext } from './useChatContext';


interface UseChatProps {
  userId: string;
  sessionId?: string;
  model: string;
}

export const useChat = ({ userId, sessionId, model }: UseChatProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  // Get store values and actions
  const {
    messages,
    setMessages,
    currentSessionId,
    setCurrentSessionId,
    chatHistories,
    setChatHistories,
  } = useChatStore()

  const {
    setModel,
    isModelLocked,
    setIsModelLocked,
    isInitialized,
    setIsInitialized,
  } = useChatContext();

  // File upload handling
  const {
    selectedFiles,
    handleFilesSelected,
    handleRemoveFile,
    processAndUploadFiles,
    setSelectedFiles,
  } = useFileUpload(userId);

  // History fetching
  const fetchChatHistory = useCallback(async (sessionId: string) => {
    if (!userId) return

    if (!userId) return null;
    try {
      const response = await fetch(`/api/chat?sessionId=${sessionId}`);
      const data = await response.json();

      if (data.error) {
        console.error('Error fetching chat history:', data.error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return null;
    }
  }, [userId]);

  const fetchChatHistories = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/chat-sessions?userId=${userId}`);
      const data = await response.json();

      if (!data.error) {
        setChatHistories(data.histories || []);
      }
    } catch (error) {
      console.error('Error fetching chat histories:', error);
    }
  }, [userId, setChatHistories]);

  // Message handling
  const createUserMessage = useCallback((text: string): Message => ({
    id: generateUniqueId(),
    content: [{ type: 'text', text: text.trim() }],
    role: 'user',
    displayedContent: text.trim(),
    createdAt: Date.now(),
  }), []);

  const createLoadingMessage = useCallback((): Message => ({
    id: generateUniqueId(),
    content: [{ type: 'text', text: '' }],
    displayedContent: '',
    role: 'assistant',
    pending: true,
    createdAt: Date.now(),
  }), []);

  const createErrorMessage = useCallback((): Message => ({
    id: generateUniqueId(),
    content: [{ type: 'text', text: 'Error sending message. Please try again.' }],
    role: 'system',
    displayedContent: 'Error sending message. Please try again.',
    createdAt: Date.now(),
  }), []);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !userId || !model) {
        console.error('Missing required data:', { inputMessage, userId, model });
        return;
    }

    if (!inputMessage.trim() && selectedFiles.length === 0) return;

    let activeSessionId = sessionId || currentSessionId;
    if (!activeSessionId) {
      try {
        const sessionResponse = await fetch('/api/chat-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, model }),
        });

        if (!sessionResponse.ok) {
          throw new Error('Failed to create new session');
        }

        const { sessionId: newSessionId } = await sessionResponse.json();
        activeSessionId = newSessionId;
        setCurrentSessionId(newSessionId);
        router.push(`/chat/${newSessionId}`);
        await fetchChatHistories();
      } catch (error) {
        console.error('Error creating new session:', error);
        return;
      }
    }

    const userMessage = createUserMessage(inputMessage);
    const loadingMessage = createLoadingMessage();
   
    setIsModelLocked(true);
      // Show user's message immediately and loading message
      setMessages(prev => [...prev, { ...userMessage, pending: false, createdAt: Date.now() },  {...loadingMessage, pending:true, createdAt: Date.now() }]);
    setIsSubmitting(true);
    setInputMessage('');
    setSelectedFiles([]);
    try {
      const fileObjects = await processAndUploadFiles(selectedFiles);
      const messageContent = [...userMessage.content, ...fileObjects];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          sessionId: activeSessionId,
          userId,
          model,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.message) {
          // Replace the loading message with the actual AI response
           setMessages(prev => prev.map(msg => {
            if(msg.pending){
                return {
                 ...data.message,
                 displayedContent: data.message.content[0]?.text || '',
                 pending: false,
                 createdAt: Date.now(),
               };
            }
            return msg;
         }));
      } else if (data.messages) {
           // Replace any existing messages if receiving a full history
           setMessages(data.messages.map((msg: Message) => ({
               ...msg,
                displayedContent: typeof msg.content[0] === 'object' ? msg.content[0] : '',
                pending: false
           })));
       }
    } catch (error) {
      console.error('Error in message handling:', error);
      setMessages(prev => [
        ...prev.filter(msg => !msg.pending),
        {...createErrorMessage(), pending: false, createdAt: Date.now() }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    inputMessage,
    userId,
    model,
    sessionId,
    currentSessionId,
    selectedFiles,
    router,
    fetchChatHistories,
    setCurrentSessionId,
  ]);

  // Session handling
  const loadChatFromHistory = useCallback(async (id: string) => {
    const historyData = await fetchChatHistory(id);
    if (historyData) {
      router.push(`/chat/${id}`);
      setCurrentSessionId(id);
      if (historyData.model) {
        setIsInitialized(true);
        setMessages(historyData.messages);
        setModel(historyData.model);
        setIsModelLocked(true);
      }
    }
  }, [fetchChatHistory, setMessages, setModel, setIsModelLocked, setCurrentSessionId, setIsInitialized, router]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setModel('gemini');
    setIsModelLocked(false);
    setIsInitialized(false);
    router.push('/chat');
  }, [setMessages, setCurrentSessionId, setModel, setIsModelLocked, setIsInitialized, router]);

  return {
    // State
    messages,
    inputMessage,
    setInputMessage,
    isSubmitting,
    selectedFiles,
    isInitialized,
    currentSessionId,
    model,
    isModelLocked,
    chatHistories,

    // Actions
    handleFilesSelected,
    handleRemoveFile,
    handleSendMessage,
    handleNewChat,
    loadChatFromHistory,
  };
};