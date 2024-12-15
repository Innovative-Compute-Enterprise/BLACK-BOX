// ChatHeader.tsx
'use client';
import React from 'react';
import ModelSelector from '@/components/chat/ModelSelector';
import { Tooltip } from '@nextui-org/tooltip';
import { SidebarTrigger } from '@/components/shadcn/sidebar';
import NewChat from '@/components/icons/chat/NewChat';

interface ChatHeaderProps {
  handleNewChat: () => void;
  model: string;
  setModel: (model: string) => void;
  isModelLocked: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = React.memo(
  ({ handleNewChat, model, setModel, isModelLocked }) => {
    return (
      <header className="relative flex items-center px-2 pt-2 bg-none">
        <div className="flex items-center gap-2">
          
          <Tooltip
            content="Menu lateral"
            showArrow={true}
            closeDelay={300}
            className="bg-[#2B2B2B]/70 backdrop-blur-xl rounded-md text-white text-sm"
          >
            <span className="inline-flex">
              <SidebarTrigger />
            </span>
          </Tooltip>

          <Tooltip
            content="Novo chat"
            showArrow={true}
            closeDelay={300}
            className="bg-[#2B2B2B]/70 backdrop-blur-xl rounded-md text-white text-sm"
          >
            <button
              onClick={handleNewChat}
              className="relative p-2"
            >
              <NewChat
                className="fill-black/10 backdrop-blur text-black dark:fill-white/10 dark:text-white"
                style={{ width: '18px', height: '18px' }} 
              />
            </button>
          </Tooltip>

          <ModelSelector
            model={model}
            setModel={setModel}
            isModelLocked={isModelLocked}
          />
        </div>
      </header>
    );
  }
);

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;