// ChatHeader.tsx
'use client';
import React from 'react';
import { Tooltip } from "@heroui/tooltip";
import { SidebarTrigger } from '@/components/shadcn/sidebar';
import NewChat from '@/components/icons/chat/NewChat';

interface ChatHeaderProps {
  handleNewChat: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = React.memo(
  ({ handleNewChat}) => {

    return (
      <header className="fixed z-[20] dark:bg-black bg-white w-full flex items-center px-3">
        <div className="flex items-center gap-2 w-full py-2">
          <Tooltip
            content="Menu lateral"
            showArrow={true}
            closeDelay={100}
            className="bg-[#2B2B2B] rounded-lg text-white text-sm"
          >
            <span className="inline-flex">
              <SidebarTrigger />
            </span>
          </Tooltip>

          <Tooltip
            content="Novo chat"
            showArrow={true}
            closeDelay={100}
            className="bg-[#b8b8b8] border-[#b8b8b8] rounded-lg text-black text-sm" 
          >
            <button onClick={handleNewChat} className="p-1 relative hover:bg-zinc-100 rounded-lg cursor-pointer dark:hover:bg-zinc-900">
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