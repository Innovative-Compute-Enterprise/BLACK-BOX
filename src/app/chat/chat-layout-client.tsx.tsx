// ChatLayoutClient.tsx
'use client'

import React from 'react';
import { AppSidebar } from '@/components/chat/chat-sidebar';
import { SubscriptionWithProduct } from '@/types/types';
import { useChatContext } from '@/context/ChatContext';
import { useChat } from '@/hooks/useChat';

interface ChatLayoutClientProps {
  children: React.ReactNode;
  sessionId: string | null;
  subscription?: SubscriptionWithProduct | null;
}

export function ChatLayoutClient({
  children,
  sessionId,
  subscription,
}: ChatLayoutClientProps) {
  const { model } = useChatContext();

  const {
    userId,
    currentSessionId,
    chatHistories,
    handleEditChat,
    handleDeleteChat,
    loadChatFromHistory, 
    fetchChatHistories 
  } = useChat({ sessionId: sessionId || undefined });

  return (
    <>
      <AppSidebar
        subscription={subscription}
        chatHistories={chatHistories}
        currentSessionId={currentSessionId}
        onEditChat={handleEditChat}
        onDeleteChat={handleDeleteChat}
        onChatSelection={loadChatFromHistory} // Use loadChatFromHistory directly
        fetchChatHistories={fetchChatHistories} // Pass fetchChatHistories
        userId={userId} // Pass userId if AppSidebar needs user info
      />
      {children}
    </>
  );
}