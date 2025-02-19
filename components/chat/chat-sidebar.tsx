// AppSidebar.tsx
import React, { useState } from 'react';
import Dashboard from '@/components/icons/chat/Dashboard';
import SearchIcon from '@/components/icons/chat/Search';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/shadcn/sidebar';
import { Badge } from '@/components/shadcn/badge'
import SettingsIcon from '@/components/icons/Settings';
import { ChatHistory, ChatHistoryProps } from './sidebar/chat-history';
import { ChatSearch } from './sidebar/chat-search';
import { Settings } from './sidebar/chat-settings';
import { SubscriptionWithProduct } from '@/types/types';

interface AppSidebarProps extends ChatHistoryProps {
    subscription?: SubscriptionWithProduct | null;
    chatHistories: ChatHistory[];
    currentSessionId: string | null;
    fetchChatHistories?: () => Promise<void>;  
    userId?: string | null;                          
  }
  


const items = [
  {
    title: 'Dashboard',
    icon: Dashboard,
    url: '/',
  },
  {
    title: 'Search',
    icon: SearchIcon,
    action: 'search',
  },
  {
    title: 'Settings',
    icon: SettingsIcon,
    action: 'settings'
  },
];

export function AppSidebar({
  chatHistories,
  currentSessionId,
  onEditChat,
  onDeleteChat,
  onChatSelection,
  subscription,
}: AppSidebarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar(); 

  const handleItemClick = (action?: string) => {
    if (action === 'search') {
      setIsSearchOpen(true);
    } else if (action === 'settings') {
      setIsSettingsOpen(true);
    }

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleChatSelection = (id: string) => {
    onChatSelection(id);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Derive the plan name from the subscription object
  let planName = 'Free tier';
  if (subscription?.status) {
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      const productName = subscription.prices?.products?.name;
      planName = productName 
        ? productName + (subscription.status === 'trialing' ? ' (Trial)' : '')
        : 'Free tier';
    }
  }
  return (
    <>
      <Sidebar className="border-none">
        <SidebarContent className="scrollbar-hide px-1">
          <SidebarGroup>
            <SidebarGroupLabel className="font-[900] text-black dark:text-white flex items-center text-base justify-between">
              BLACK BOX
              <Badge variant="outline" className="text-xs">
                {planName}
              </Badge>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="mt-6">
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}  className="py-1 hover:cursor-pointer">
                    <SidebarMenuButton className='p-1.5' asChild>
                      <a
                        href={item.url}
                        onClick={(e) => {
                          if (item.action) {
                            e.preventDefault();
                            handleItemClick(item.action);
                          }
                        }}
                      >
                        <item.icon className="size-8 fill-black/10 backdrop-blur text-black dark:fill-white/10 dark:text-white" />
                        <span className='text-sm font-semibold ml-2'>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className='mt-6'>
            <SidebarGroupContent>
              <ChatHistory
                chatHistories={chatHistories}
                currentSessionId={currentSessionId}
                onEditChat={onEditChat}
                onDeleteChat={onDeleteChat}
                onChatSelection={handleChatSelection}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {isSearchOpen && (
        <ChatSearch
          chatHistories={chatHistories}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onChatSelection={(id) => {
            handleChatSelection(id);
            setIsSearchOpen(false);
          }}
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