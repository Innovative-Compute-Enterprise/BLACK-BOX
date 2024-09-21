'use client';
import React from 'react';
import ChatHistory from '../ChatHistory';

// ChatHistoryDrawer component to render the chat history in a drawer
const ChatHistoryDrawer = ({ isDrawerOpen, chatHistories, loadChatFromHistory, currentSessionId, onEditChat, onDeleteChat }) => {
  return (
    <div className={`fixed top-0 left-0 h-full transition-all duration-300 ease-in-out z-10 ${isDrawerOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
      <ChatHistory 
        onDeleteChat={onDeleteChat}
        onEditChat={onEditChat}
        isDrawerOpen={isDrawerOpen}
        chatHistories={chatHistories}
        loadChatFromHistory={loadChatFromHistory}
        currentSessionId={currentSessionId}
      />
    </div>
  );
};

export default ChatHistoryDrawer;