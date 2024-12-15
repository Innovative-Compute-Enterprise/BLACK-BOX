'use client'
import { AppSidebar } from '@/components/chat/chat-sidebar'
import { SubscriptionWithProduct } from '@/types/types';
import { useChatContext } from '@/context/ChatContext'
import { useChatSession } from '@/hooks/useChatSession'
import { useChat } from '@/hooks/useChat'

interface ChatLayoutClientProps {
  children: React.ReactNode;
  sessionId: string | null;
  subscription?: SubscriptionWithProduct | null;
}

export function ChatLayoutClient({ children, sessionId, subscription }: ChatLayoutClientProps) {
  const { model, setModel } = useChatContext();
  
  const {
    userId,
    currentSessionId,
    chatHistories,
    handleEditChat,
    handleDeleteChat,
  } = useChatSession(sessionId, setModel);

  const { loadChatFromHistory } = useChat({ 
    userId, 
    sessionId: currentSessionId, 
    model
  });

  return (
    <>
      <AppSidebar
        subscription={subscription}
        chatHistories={chatHistories}
        currentSessionId={currentSessionId}
        onEditChat={handleEditChat}
        onDeleteChat={handleDeleteChat}
        onChatSelection={loadChatFromHistory}
      />
      {children}
      </>
  );
}
