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
  
  const { model, setModel, isModelLocked } = useChatContext(); 
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
  } = useChat({ sessionId: sessionId }); 

  return (
    <div className="flex-1 flex flex-col relative">
      <ChatHeader
        handleNewChat={handleNewChat}
      />
      
      <div className="flex-1 relative">
        <MessageDisplay messages={messages} />
      </div>


      <ChatDock
          input={inputMessage}
          setInput={setInputMessage}
          handleSendMessage={handleSendMessage}
          isSubmitting={isSubmitting}
          onFilesSelected={handleFilesSelected}
          selectedFiles={selectedFiles}
          onRemoveFile={handleRemoveFile}
          hasMessages={ !!sessionId || messages.length > 0 || isSubmitting } 
          model={model}
          setModel={setModel}
          isModelLocked={isModelLocked}
        />
    </div>
  );
}
