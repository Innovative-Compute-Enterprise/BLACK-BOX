// hooks/useMessages.ts
import { useState, useCallback } from 'react';
import { Message } from '@/types/chat';
import { generateUniqueId } from '@/utils/uniqueId';

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addUserMessage = useCallback((content: string) => {
    const userMessage: Message = {
      id: generateUniqueId(),
      content: [{ type: 'text', text: content.trim() }],
      role: 'user',
      displayedContent: content.trim(),
      createdAt: Date.now(),
    };

    const loadingMessage: Message = {
      id: generateUniqueId(),
      content: [{ type: 'text', text: '' }],
      displayedContent: '',
      role: 'assistant',
      pending: true,
      createdAt: Date.now(),
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    return userMessage;
  }, []);

  const updateAssistantMessage = useCallback((assistantMessage: Message) => {
    setMessages(prev => {
      const updatedMessages = prev.slice(0, -1);
      return [...updatedMessages, {
        ...assistantMessage,
        displayedContent: '',
        pending: false,
        createdAt: Date.now(),
      }];
    });
  }, []);

  const handleError = useCallback(() => {
    setMessages(prev => {
      const updatedMessages = prev.slice(0, -1);
      return [...updatedMessages, {
        id: generateUniqueId(),
        content: [{ type: 'text', text: 'Error sending message. Please try again.' }],
        role: 'system',
        displayedContent: 'Error sending message. Please try again.',
        createdAt: Date.now(),
      }];
    });
  }, []);

  return {
    messages,
    setMessages,
    addUserMessage,
    updateAssistantMessage,
    handleError,
  };
};