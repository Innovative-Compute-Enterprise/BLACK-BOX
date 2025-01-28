// Chat.tsx
'use client'
import React from 'react';
import { useChatContext } from '@/context/ChatContext';
import { useChat } from '@/hooks/useChat'; 
import MessageDisplay from './MessageDisplay';
import ChatDock from './chat-dock';
import ChatHeader from './chat-header';

interface ChatProps {
  sessionId?: string;
}

export function Chat({ sessionId }: ChatProps) {
  const { model, setModel, isDrawerOpen, toggleDrawer, isModelLocked } = useChatContext(); 
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
    chatHistories, 
    loadChatFromHistory, 
    handleEditChat, 
    handleDeleteChat,  
    setCurrentSessionId, 
    currentSessionId, 
    fetchChatHistories, 
    userId
  } = useChat({ sessionId: sessionId || undefined }); 

  return (
    <div className="flex-1 flex flex-col relative">
      <ChatHeader
        model={model}
        setModel={setModel}
        handleNewChat={handleNewChat}
        isModelLocked={isModelLocked}
      />
      
      <div className="flex-1 relative">
        <MessageDisplay messages={messages} />
      </div>

      <div>
        <ChatDock
          input={inputMessage}
          setInput={setInputMessage}
          handleSendMessage={handleSendMessage}
          isSubmitting={isSubmitting || !userId}
          onFilesSelected={handleFilesSelected}
          selectedFiles={selectedFiles}
          onRemoveFile={handleRemoveFile}
          hasMessages={messages.length > 0}
        />
      </div>
    </div>
  );
}
