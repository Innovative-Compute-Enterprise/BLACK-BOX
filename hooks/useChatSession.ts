// hooks/useChatSession.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatHistory } from '@/types/chat';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export const useChatSession = (
  initialSessionId: string | null,
  setModel: (model: string) => void
) => {
  const supabase = createClient();
  const router = useRouter();

  // Session state
  const [userId, setUserId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [isModelLocked, setIsModelLocked] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Auth handling
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) setUserId(data.user?.id || null);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => authListener?.subscription.unsubscribe();
  }, [supabase]);

  // Fetch histories
  const fetchChatHistories = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/chat-sessions?userId=${userId}`);
      const data = await response.json();
      if (!data.error) setChatHistories(data.histories || []);
    } catch (error) {
      console.error('Error fetching chat histories:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) 
      fetchChatHistories();
      
  }, [userId, fetchChatHistories]);

  // Session actions
  const handleEditChat = useCallback(async (id: string, newTitle: string) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: newTitle, userId }),
      });
      const data = await response.json();
      if (!data.error) {
        setChatHistories(prev =>
          prev.map(chat => chat.id === id ? { ...chat, title: newTitle } : chat)
        );
      }
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  }, [userId]);

  const handleDeleteChat = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/chat-sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (!data.error) {
        setChatHistories(prev => prev.filter(chat => chat.id !== id));
        if (currentSessionId === id) {
          setModel('gpt-4o-mini');
          setCurrentSessionId(null);
          setIsModelLocked(false);
          setIsInitialized(false);
          router.push('/chat');
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }, [userId, currentSessionId, router, setModel]);

  return {
    // State
    userId,
    currentSessionId,
    isModelLocked,
    isInitialized,
    chatHistories,

    // Actions
    setCurrentSessionId,
    setIsModelLocked,
    setIsInitialized,
    handleEditChat,
    handleDeleteChat,
    fetchChatHistories
  };
};