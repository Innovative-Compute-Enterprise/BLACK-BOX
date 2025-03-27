// ChatLayoutClient.tsx
"use client";

import React, { useEffect, useCallback } from "react";
import { AppSidebar } from "@/src/components/chat/chat-sidebar";
import { SubscriptionWithProduct } from "@/src/types/types";
import { useChat } from "@/src/hooks/useChat";

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
  const {
    userId,
    currentSessionId,
    chatHistories,
    handleEditChat,
    handleDeleteChat,
    handleMultiDeleteChat,
    loadChatFromHistory,
    fetchChatHistories,
  } = useChat({ sessionId: sessionId || undefined });

  // Initial fetch of chat histories when component mounts
  useEffect(() => {
    if (userId) {
      fetchChatHistories();
    }
  }, [userId, fetchChatHistories]);

  // Force refresh when sessionId changes
  useEffect(() => {
    if (userId && sessionId) {
      fetchChatHistories();
    }
  }, [userId, sessionId, fetchChatHistories]);

  return (
    <>
      <AppSidebar
        subscription={subscription}
        chatHistories={chatHistories}
        currentSessionId={currentSessionId}
        onEditChat={handleEditChat}
        onDeleteChat={handleDeleteChat}
        onMultiDeleteChat={handleMultiDeleteChat}
        onChatSelection={loadChatFromHistory}
        fetchChatHistories={fetchChatHistories}
        userId={userId}
      />
      {children}
    </>
  );
}
