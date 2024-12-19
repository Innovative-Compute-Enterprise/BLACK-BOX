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
      <header className="relative flex items-center px-2 py-3 md:pt-3 md:pb-0">
        <div className="flex items-center gap-2 w-full">
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
            closeDelay={300}
            className="bg-[#2B2B2B]/70 backdrop-blur-xl rounded-md text-white text-sm ml-auto" // Added ml-auto here
          >
            <button onClick={handleNewChat} className="relative p-2">
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