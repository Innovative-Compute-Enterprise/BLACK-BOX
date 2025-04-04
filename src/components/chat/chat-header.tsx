// ChatHeader.tsx
'use client';
import React, { useState, useCallback } from 'react';
import { Tooltip } from "@heroui/tooltip";
import { Home, MessagesSquare, LayoutDashboard, SquarePlus, Settings as SettingsIcon  } from 'lucide-react';
import { Badge } from '../shadcn/badge';
import { MonaSans } from "@/src/styles/fonts/font";
import { SubscriptionWithProduct } from "@/src/types/types";
import { ChatSearch, PreviewMessage, ChatHistory as SearchChatHistory } from "./sidebar/chat-search";
import { Settings } from "./sidebar/chat-settings";

interface HeaderActionItem {
  title: string;
  icon: React.ElementType; // Use React.ElementType for component icons
  onClick: (e?: React.MouseEvent) => void; // Direct click handler
}

interface ChatHeaderProps {
  handleNewChat: (e?: React.MouseEvent) => void;
  toggleModelLock?: (locked: boolean) => void;
  subscription?: SubscriptionWithProduct | null;
  chatHistories: SearchChatHistory[];
  onChatSelection: (id: string) => void;
  onDeleteChat: (id: string) => Promise<void>;
}

const ChatHeader: React.FC<ChatHeaderProps> = React.memo(
  ({
    handleNewChat,
    toggleModelLock,
    subscription,
    chatHistories,
    onChatSelection,
    onDeleteChat,
  }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleChatSelection = (id: string) => {
      onChatSelection(id);
      setIsSearchOpen(false);
    };

    let planName = "Free tier";
    if (subscription?.status) {
      if (
        subscription.status === "active" ||
        subscription.status === "trialing"
      ) {
        const productName = subscription.prices?.products?.name;
        planName = productName
          ? productName + (subscription.status === "trialing" ? " (Trial)" : "")
          : "Free tier";
      }
    }

    const fetchMessagesPreview = useCallback(async (chatId: string): Promise<PreviewMessage[]> => {
      console.log(`[ChatHeader] Fetching real preview for ${chatId}`);
      if (chatId.startsWith("temp")) { return []; }
      try {
        const response = await fetch(`/api/chat?sessionId=${chatId}`);
        if (!response.ok) { throw new Error(`API error: ${response.statusText}`); }
        const data = await response.json();
        if (data.error) { throw new Error(data.error); }

        const allMessages: any[] = data.messages || [];
        const recentMessages = allMessages.slice(-5);
        const previewMessages: PreviewMessage[] = recentMessages.map((msg: any) => {
          let textContent = "";
          if (Array.isArray(msg.content)) {
            textContent = msg.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join(" ") || "(No text content)";
          } else if (typeof msg.content === 'string') {
            textContent = msg.content;
          } else { textContent = "(Unsupported content format)"; }
          return {
            id: msg.id || `preview-${Math.random()}`,
            role: msg.role || 'unknown',
            content: textContent,
          };
        });
        return previewMessages;
      } catch (error) {
        console.error(`[ChatHeader] Error fetching message preview for ${chatId}:`, error);
        return [];
      }
    }, []);

    const handleSearchDeleteRequest = useCallback((chatId: string) => {
      console.log(`[ChatHeader] Delete requested for chat ${chatId} from search.`);
      onDeleteChat(chatId);
      setIsSearchOpen(false);
    }, [onDeleteChat]);

    // Define items array inside the component with all buttons
    const items: HeaderActionItem[] = [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        onClick: () => window.location.href = '/',
      },
      {
        title: "Novo chat",
        icon: SquarePlus,
        onClick: handleNewChat,
      },
      {
        title: "Conversas",
        icon: MessagesSquare,
        onClick: () => setIsSearchOpen(true),
      },
      {
        title: "Configurações",
        icon: SettingsIcon,
        onClick: () => setIsSettingsOpen(true),
      },
    ];

    return (
      <>
        <header className="z-[20] fixed top-0 left-0 right-0 md:bg-transparent dark:bg-black bg-white w-full flex items-center justify-between px-4 py-2 dark:border-white/10 border-black/10">
          <div className="flex items-center gap-3">
            <p
              className={`font-[900] uppercase text-black dark:text-white flex items-center text-base ${MonaSans.className}`}
              style={{ fontStretch: "125%" }}
            >
              BLACK BOX
            </p>
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              {planName}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {items.map((item) => (
              <Tooltip
                key={item.title}
                content={item.title}
                showArrow={true}
                closeDelay={100}
                className="bg-[#2B2B2B] rounded-lg p-2 text-white text-sm"
              >
                <button
                  className="p-2 relative hover:bg-zinc-100 cursor-pointer dark:hover:bg-zinc-900 dark:bg-black bg-white rounded-full"
                  onClick={item.onClick} 
                >
                  <item.icon
                    className="text-black dark:text-white "
                    style={{ width: '20px', height: '20px' }}
                  />
                </button>
              </Tooltip>
            ))}
          </div>
        </header>

        {isSearchOpen && (
          <ChatSearch
            chatHistories={chatHistories}
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onChatSelection={handleChatSelection}
            fetchMessagesPreview={fetchMessagesPreview}
            onCreateNewChat={() => {
              handleNewChat();
              setIsSearchOpen(false);
            }}
            onDeleteChatRequest={handleSearchDeleteRequest}
          />
        )}

        {isSettingsOpen && (
          <Settings
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </>
    );
  }
);

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;