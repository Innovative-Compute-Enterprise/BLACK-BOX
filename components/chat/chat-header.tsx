// ChatHeader.tsx
'use client';
import React from 'react';
import ModelSelector from '@/components/chat/ModelSelector';
import { Tooltip } from '@nextui-org/tooltip';
import { SidebarTrigger } from '@/components/shadcn/sidebar';
import NewChat from '@/components/icons/chat/NewChat';
import { useIsMobile } from "@/hooks/use-mobile"

interface ChatHeaderProps {
  handleNewChat: () => void;
  model: string;
  setModel: (model: string) => void;
  isModelLocked: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = React.memo(
  ({ handleNewChat, model, setModel, isModelLocked }) => {
    const isMobile = useIsMobile();

    return (
      <header className="fixed z-[333] dark:bg-black bg-white w-full flex items-center px-3">
        <div className="flex items-center gap-2 w-full py-2.5">
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

          {isMobile && (
            <div className="flex items-center justify-center w-full gap-2">
                <ModelSelector
                model={model}
                setModel={setModel}
                isModelLocked={isModelLocked}
                />
            </div>
          )}
          

          <Tooltip
            content="Novo chat"
            showArrow={true}
            closeDelay={100}
            className="bg-[#2B2B2B] rounded-lg text-white text-sm" 
          >
            <button onClick={handleNewChat} className="p-1.5 relative hover:bg-zinc-100 rounded-lg cursor-pointer dark:hover:bg-zinc-900">
              <NewChat
                className="fill-black/10 backdrop-blur text-black dark:fill-white/10 dark:text-white"
                style={{ width: '18px', height: '18px' }}
              />
            </button>
          </Tooltip>

          {!isMobile && (
            <ModelSelector
              model={model}
              setModel={setModel}
              isModelLocked={isModelLocked}
            />
          )}
        </div>
      </header>
    );
  }
);

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;