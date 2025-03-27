// ChatHeader.tsx
'use client';
import React from 'react';
import { Tooltip } from "@heroui/tooltip";
import { SidebarTrigger } from '@/src/components/shadcn/sidebar';
import NewChat from '@/src/components/icons/chat/NewChat';

interface ChatHeaderProps {
  handleNewChat: (e?: React.MouseEvent) => void;
  toggleModelLock?: (locked: boolean) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = React.memo(
  ({ handleNewChat, toggleModelLock }) => {
    return (
      <header className="fixed z-[20] bg-transparent w-full flex items-center px-3">
        <div className="flex items-center gap-2 w-full py-2">
          <Tooltip
            content="Menu lateral"
            showArrow={true}
            closeDelay={100}
            className="bg-[#2B2B2B] rounded-lg text-white text-sm"
          >
            <span className="inline-flex dark:bg-black bg-white rounded-full p-2">
              <SidebarTrigger />
            </span>
          </Tooltip>

          <Tooltip
            content="Novo chat"
            showArrow={true}
            closeDelay={100}
            className="bg-[#2B2B2B] rounded-lg p-2 text-white text-sm" 
          >
            <button onClick={handleNewChat} className="p-2 relative hover:bg-zinc-100
           cursor-pointer dark:hover:bg-zinc-900 dark:bg-black bg-white rounded-full">
              <NewChat
                className=" text-black  dark:text-white"
                style={{ width: '22px', height: '22px' }}
              />
            </button>
          </Tooltip>

        </div>
      </header>
    );
  }
);

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;