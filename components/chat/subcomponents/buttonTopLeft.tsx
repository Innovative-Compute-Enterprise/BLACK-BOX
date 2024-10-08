// components/ChatHeader.tsx
'use client';

import React from 'react';
import X from '@/components/icons/X';
import PanelLeftOpen from '@/components/icons/PanelLeftOpen';
import NewChat from '@/components/icons/NewChat';
import ModelSelector from '@/components/chat/ModelSelector';
import { Tooltip } from "@nextui-org/tooltip";


interface ChatHeaderProps {
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  handleNewChat: () => void;
  model: string;
  setModel: (model: string) => void;
  isModelLocked: boolean; // New prop to indicate if the model is locked
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isDrawerOpen,
  toggleDrawer,
  handleNewChat,
  model,
  setModel,
  isModelLocked,
}) => {
  return (
    <div className="fixed left-3 top-3 z-30 flex space-x-5 overscroll-none">
      {/* Button to toggle chat history drawer */}
      <Tooltip content={isDrawerOpen ? 'Fechar' : 'Menu lateral'} showArrow={true} closeDelay={300} className='p-1.5 bg-[#2B2B2B]/70 backdrop-blur-xl rounded-md text-white text-sm'>
      <button onClick={toggleDrawer} aria-label={isDrawerOpen ? 'Close chat history' : 'Open chat history'}>
        {isDrawerOpen ? <X /> : <PanelLeftOpen />}
      </button>
      </Tooltip>

      {/* Button to start a new chat */}
      <Tooltip content="Novo chat" showArrow={true} closeDelay={300} className='p-1.5 bg-[#2B2B2B]/70 backdrop-blur-xl rounded-md text-white text-sm'>
      <button onClick={handleNewChat} aria-label="New chat">
        <NewChat />
      </button>
      </Tooltip>

      {/* Model Selector */}
      <ModelSelector model={model} setModel={setModel} isModelLocked={isModelLocked} />
    </div>
  );
};

export default ChatHeader;
