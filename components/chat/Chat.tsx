// Chat.tsx
'use client'
import React from 'react';
import { useChatContext } from '@/context/ChatContext';
import { useChat } from '@/hooks/useChat';
import { useChatSession } from '@/hooks/useChatSession';
import MessageDisplay from './MessageDisplay';
import ChatDock from './chat-dock';
import ChatHeader from './subcomponents/buttonTopLeft';

interface ChatProps {
  sessionId?: string;
}

export default function Chat({ sessionId }: ChatProps) {
  const { model, setModel } = useChatContext();
  const {
    userId,
    currentSessionId,
    isModelLocked,
    isInitialized,
  } = useChatSession(sessionId, setModel);

  const {
    messages,
    inputMessage,
    isSubmitting,
    selectedFiles,
    setInputMessage,
    handleSendMessage,
    handleFilesSelected,
    handleRemoveFile,
    handleNewChat,
  } = useChat({ 
    userId, 
    sessionId: currentSessionId,
    model 
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ChatHeader
        model={model}
        setModel={setModel}
        handleNewChat={handleNewChat}
        isModelLocked={isModelLocked}
      />
      
      <div className="flex-1 relative overflow-hidden">
        <MessageDisplay messages={messages} />
      </div>

      <div>
        <ChatDock
          input={inputMessage}
          setInput={setInputMessage}
          handleSendMessage={handleSendMessage}
          isSubmitting={isSubmitting || !isInitialized || !userId}
          onFilesSelected={handleFilesSelected}
          selectedFiles={selectedFiles}
          onRemoveFile={handleRemoveFile}
          hasMessages={messages.length > 0}
        />
      </div>
    </div>
  );
}
