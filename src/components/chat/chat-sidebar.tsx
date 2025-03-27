// AppSidebar.tsx - Updated to handle real-time updates
import React, { useState, useEffect, useCallback } from "react";
import Dashboard from "@/src/components/icons/chat/Dashboard";
import SearchIcon from "@/src/components/icons/chat/Search";
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
} from "@/src/components/shadcn/sidebar";
import { Badge } from "@/src/components/shadcn/badge";
import SettingsIcon from "@/src/components/icons/Settings";
import { ChatHistory, ChatHistoryProps } from "./sidebar/chat-history";
import { ChatSearch } from "./sidebar/chat-search";
import { Settings } from "./sidebar/chat-settings";
import { MonaSans } from "@/src/styles/fonts/font";
import { SubscriptionWithProduct } from "@/src/types/types";

interface AppSidebarProps extends ChatHistoryProps {
  subscription?: SubscriptionWithProduct | null;
  chatHistories: ChatHistory[];
  currentSessionId: string | null;
  fetchChatHistories?: () => Promise<void>;
  userId?: string | null;
}

const items = [
  {
    title: "Dashboard",
    icon: Dashboard,
    url: "/",
  },
  {
    title: "Search",
    icon: SearchIcon,
    action: "search",
  },
  {
    title: "Settings",
    icon: SettingsIcon,
    action: "settings",
  },
];

export function AppSidebar({
  chatHistories,
  currentSessionId,
  onEditChat,
  onDeleteChat,
  onMultiDeleteChat,
  onChatSelection,
  subscription,
  fetchChatHistories,
  userId,
}: AppSidebarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();

  // Handle real-time updates - refresh data when component receives new props
  useEffect(() => {
    // The component will re-render when chatHistories prop changes
    console.log("Chat histories updated in sidebar:", chatHistories.length);
  }, [chatHistories]);

  // Manual refresh function for user-triggered refreshes
  const refreshChatHistories = useCallback(() => {
    if (fetchChatHistories) {
      console.log("Manually refreshing chat histories");
      fetchChatHistories();
    }
  }, [fetchChatHistories]);

  const handleItemClick = (action?: string) => {
    if (action === "search") {
      setIsSearchOpen(true);
    } else if (action === "settings") {
      setIsSettingsOpen(true);
    }

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleChatSelection = (id: string) => {
    onChatSelection(id);
    // After selecting a chat, refresh the list to ensure UI is in sync
    refreshChatHistories();

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Derive the plan name from the subscription object
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
  return (
    <>
      <Sidebar className="border-none">
        <SidebarContent className="scrollbar-hide px-1">
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <p
                className={`font-[900] uppercase text-black dark:text-white flex items-center text-base justify-between ${MonaSans.className}`}
                style={{ fontStretch: "125%" }}
              >
                BLACK BOX
              </p>
              <Badge variant="outline" className="text-xs">
                {planName}
              </Badge>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="mt-6">
                {items.map((item) => (
                  <SidebarMenuItem
                    key={item.title}
                    className="py-1 hover:cursor-pointer"
                  >
                    <SidebarMenuButton className="p-1.5" asChild>
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
                        <span className="text-sm font-semibold ml-2">
                          {item.title}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-6">
            <SidebarGroupContent>
              <ChatHistory
                chatHistories={chatHistories}
                currentSessionId={currentSessionId}
                onEditChat={onEditChat}
                onDeleteChat={onDeleteChat}
                onMultiDeleteChat={onMultiDeleteChat}
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
