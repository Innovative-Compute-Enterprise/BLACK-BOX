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
import { ChatSearch, PreviewMessage, ChatHistory as SearchChatHistory } from "./sidebar/chat-search";
import { Settings } from "./sidebar/chat-settings";
import { MonaSans } from "@/src/styles/fonts/font";
import { SubscriptionWithProduct } from "@/src/types/types";

// Remove extends ChatHistoryProps and define all props explicitly
interface AppSidebarProps {
  subscription?: SubscriptionWithProduct | null;
  chatHistories: SearchChatHistory[]; 
  currentSessionId: string | null;
  fetchChatHistories?: () => Promise<void>;
  userId?: string | null;
  handleNewChat: () => void; 
  // Define props received from parent (likely useChat signatures)
  onEditChat: (id: string, newTitle: string) => Promise<void>;
  onDeleteChat: (id: string) => Promise<void>;
  onMultiDeleteChat: (ids: string[]) => Promise<void>;
  onChatSelection: (id: string) => void; // Assuming this one doesn't need to be async
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
  handleNewChat,
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

  // --- Function to Fetch Actual Message Preview ---
  const fetchMessagesPreview = useCallback(async (chatId: string): Promise<PreviewMessage[]> => {
    console.log(`[AppSidebar] Fetching real preview for ${chatId}`);
    if (chatId.startsWith("temp")) { // Avoid fetching for temp IDs
      return [];
    }
    try {
      // Use the existing API endpoint pattern from useChat
      const response = await fetch(`/api/chat?sessionId=${chatId}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Assuming data contains a 'messages' array similar to useChat
      const allMessages: any[] = data.messages || []; 
      
      // Get the last N messages (e.g., 5)
      const recentMessages = allMessages.slice(-5);
      
      // Map to the PreviewMessage format required by ChatSearch
      const previewMessages: PreviewMessage[] = recentMessages.map((msg: any) => {
         // Extract text content - handles array or string content
         let textContent = "";
         if (Array.isArray(msg.content)) {
           textContent = msg.content
             .filter((c: any) => c.type === 'text')
             .map((c: any) => c.text)
             .join(" ") || "(No text content)";
         } else if (typeof msg.content === 'string') {
           textContent = msg.content;
         } else {
           textContent = "(Unsupported content format)";
         }
         
         return {
            id: msg.id || `preview-${Math.random()}`, // Ensure an ID exists
            role: msg.role || 'unknown', 
            content: textContent, // Use the extracted text
         };
      });

      return previewMessages;

    } catch (error) {
      console.error(`[AppSidebar] Error fetching message preview for ${chatId}:`, error);
      // Return empty array or re-throw depending on how ChatSearch handles errors
      // Returning empty means the right pane will show "No preview available"
      return []; 
    }
  }, []); // No dependencies needed as fetch URL is constructed internally

  // --- Wrappers for ChatSearch Actions ---
  // Wrapper for Edit: ChatSearch cannot provide newTitle, so it just signals intent.
  const handleSearchEditRequest = useCallback((chatId: string) => {
    console.log(`[AppSidebar] Edit requested for chat ${chatId} from search. Triggering rename flow elsewhere.`);
    // Option 1: Close search and maybe open a rename modal? (Requires more state/logic)
    setIsSearchOpen(false);
    // Option 2: Call the original onEditChat with a placeholder or trigger a different action.
    // For now, just log. You might need to pass another prop like `onStartRename(chatId)`.
    // onEditChat(chatId, "TEMP_TITLE"); // Example - likely incorrect
  }, []); // Add dependencies if needed, e.g. [onEditChat]

  // Wrapper for Delete: ChatSearch provides chatId, call the original prop.
  const handleSearchDeleteRequest = useCallback((chatId: string) => {
    console.log(`[AppSidebar] Delete requested for chat ${chatId} from search.`);
    onDeleteChat(chatId); // Call the original onDeleteChat prop
    // Search modal usually closes after delete
    setIsSearchOpen(false);
  }, [onDeleteChat]); // Depend on the original onDeleteChat prop

  return (
    <>
      <Sidebar className="border-none">
        <SidebarContent className="scrollbar-hide px-1">
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between mt-1.5">
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

          <SidebarGroup className="mt-3">
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
          fetchMessagesPreview={fetchMessagesPreview}
          onCreateNewChat={handleNewChat}
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
