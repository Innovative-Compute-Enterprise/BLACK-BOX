'use client'; 
import React from 'react';
import X from '@/components/icons/X';
import PanelLeftOpen from '@/components/icons/PanelLeftOpen';
import NewChat from '@/components/icons/NewChat';
import Settings from '@/components/icons/Settings';

// ChatHeader component for displaying top-left buttons (drawer toggle, new chat, settings)
const ChatHeader = ({ isDrawerOpen, toggleDrawer, handleNewChat, toggleSettings }) => { 
  return (
    <div className="fixed left-5 top-4 z-30 flex space-x-5 overscroll-none">
      {/* Button to toggle chat history drawer */}
      <button onClick={toggleDrawer} aria-label={isDrawerOpen ? "Close chat history" : "Open chat history"}> 
        {isDrawerOpen ? <X /> : <PanelLeftOpen />} 
      </button>

      <button onClick={handleNewChat} aria-label="New chat"> 
        <NewChat /> 
      </button>

      {/* Button for settings (no action implemented yet) */}
      <button onClick={toggleSettings} aria-label="Settings"> 
       <Settings /> 
      </button>
    </div>
  );
};

export default ChatHeader; 