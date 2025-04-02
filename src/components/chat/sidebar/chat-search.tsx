import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/src/components/shadcn/command";
import { Search, MessageSquareText, Share, Pencil, Trash2, ExternalLink, Loader2, PlusCircle } from "lucide-react";

// Define a basic structure for preview messages
// Export the PreviewMessage interface
export interface PreviewMessage {
  id: string;
  role: 'user' | 'assistant' | string; // Allow other roles if needed
  content: string;
}

// Export the ChatHistory interface
export interface ChatHistory {
  id: string;
  title?: string;
  created_at: string; // Keep or remove based on usage
}

interface ChatSearchProps {
  chatHistories: ChatHistory[];
  onChatSelection: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  // --- New Props ---
  fetchMessagesPreview: (chatId: string) => Promise<PreviewMessage[]>; // Function to get preview messages
  onCreateNewChat: () => void; // Function to handle creating a new chat
  onDeleteChatRequest: (chatId: string) => void; // Function to signal a delete request
}

export function ChatSearch({
  chatHistories,
  onChatSelection,
  isOpen,
  onClose,
  fetchMessagesPreview, // Destructure new props
  onCreateNewChat,
  onDeleteChatRequest,
}: ChatSearchProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hoveredChat, setHoveredChat] = useState<ChatHistory | null>(null);
  // --- State for Message Preview ---
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[] | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For debouncing hover

  const handleSelect = (id: string) => {
    onChatSelection(id);
    onClose();
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    }
  }, [onClose]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  }, [modalRef, onClose]);

  // --- Effect to fetch preview on hover (debounced) ---
  useEffect(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (hoveredChat) {
      setIsPreviewLoading(true);
      setPreviewMessages(null); // Clear previous messages
      setPreviewError(null);

      hoverTimeoutRef.current = setTimeout(() => {
        fetchMessagesPreview(hoveredChat.id)
          .then(messages => {
            setPreviewMessages(messages);
          })
          .catch(error => {
            console.error("Error fetching message preview:", error);
            setPreviewError("Could not load preview.");
          })
          .finally(() => {
            setIsPreviewLoading(false);
          });
      }, 300); // 300ms debounce
    } else {
      setPreviewMessages(null);
      setIsPreviewLoading(false);
      setPreviewError(null);
    }

    // Cleanup timeout on unmount or when hoveredChat changes
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [hoveredChat, fetchMessagesPreview]);


  useEffect(() => {
    if (isOpen) {
        inputRef.current?.focus();
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);
        // Reset state when opening
        setHoveredChat(null);
        setPreviewMessages(null);
        setIsPreviewLoading(false);
        setPreviewError(null);
    } else {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleClickOutside);
        // Clear timeout if modal is closed
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
    }

    return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleClickOutside);
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
    };
  }, [isOpen, handleKeyDown, handleClickOutside]);


  if (!isOpen) {
    return null;
  }

  // --- Updated Action Handlers ---
  const handleOpenInNewTab = (chatId: string) => {
    // Assumes a route structure like /chat/[chatId]
    window.open(`/chat/${chatId}`, '_blank', 'noopener,noreferrer');
    onClose(); // Close the modal after opening in new tab
  };

  const handleCreateClick = () => {
    onCreateNewChat();
    onClose();
  }

  const handleDeleteClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent triggering item selection
    onDeleteChatRequest(chatId);
    // Close modal after delete action usually makes sense
    // onClose(); // Let the parent decide if modal should close
  }


  // --- Increased base text size and refined styles ---
  return (
    <div className="fixed inset-0 flex items-start justify-center pt-16 sm:pt-20 bg-black/60 dark:bg-black/70 z-[50] backdrop-blur-md text-base">
      <div
        ref={modalRef}
        // Increased max-width slightly, adjusted background for dark mode
        className="w-full max-w-5xl h-[75vh] max-h-[700px] dark:bg-[#101010] bg-[#FAFAFA] rounded-xl border dark:border-white/10 border-black/10 overflow-hidden flex shadow-2xl"
      >
        {/* Left Pane: Search, Create, List */}
        {/* Ensure the container takes full height */}
        <div className="w-1/2 border-r dark:border-white/10 border-black/10 flex flex-col h-full">
           {/* Make Command component fill height */}
           <Command className="bg-transparent h-full flex flex-col rounded-l-xl">

             {/* --- Search Input --- */}
             <div className="flex items-center border-b px-2 dark:border-white/10 border-black/10 flex-shrink-0">
                <CommandInput
                  ref={inputRef}
                  placeholder="Search chats..."
                  // Increased text size
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0 ring-0 focus:border-0"
                />
             </div>

             <div className="p-2 border-b dark:border-white/10 border-black/10 flex-shrink-0">
                <button
                   onClick={handleCreateClick}
                   className="flex items-center w-full px-3 py-2.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                 >
                   <PlusCircle className="mr-2.5 h-4 w-4" />
                   <span>Create New Chat</span>
                 </button>
             </div>

             {/* --- Chat List (Scrollable) --- */}
             {/* Adjusted max-h is removed, flex-grow handles height */}
             <CommandList className="scrollbar-hide flex-grow overflow-y-auto p-2">
                <CommandEmpty>No chats found.</CommandEmpty>
                {/* Removed CommandGroup heading for cleaner look */}
                 {chatHistories.map((chat) => (
                   <CommandItem
                     key={chat.id}
                     // Added group class for hover effect on buttons
                     className="group flex items-center justify-between py-2.5 px-3 cursor-pointer rounded-md data-[selected=true]:bg-accent hover:bg-accent aria-selected:bg-accent"
                     onMouseEnter={() => setHoveredChat(chat)}
                     // Keep track of selection for aria-selected, actual navigation on click
                     value={chat.title || `chat-${chat.id}`} // Needs a value for Command behavior
                     onSelect={() => handleSelect(chat.id)} // Use onSelect for keyboard nav too
                   >
                     {/* Use div for layout, not interaction */}
                     <div className="flex items-center flex-grow truncate mr-2 pointer-events-none">
                       <MessageSquareText className="mr-2.5 h-4 w-4 shrink-0 opacity-70" />
                       {/* Text size for chat title (kept sm for density) */}
                       <span className="truncate text-sm">{chat.title || "Untitled Chat"}</span>
                     </div>
                     {/* --- Inline Action Buttons (Appear on Hover) --- */}
                     <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                       <button
                         onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInNewTab(chat.id);
                         }}
                         className="p-1.5 rounded hover:bg-muted"
                         title="Open in New Tab"
                       >
                         <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                       </button>
                       <button
                         onClick={(e) => handleDeleteClick(e, chat.id)}
                         className="p-1.5 rounded hover:bg-red-500/10 text-red-500/80 hover:text-red-500"
                         title="Delete Chat"
                       >
                         <Trash2 className="h-3.5 w-3.5" />
                       </button>
                     </div>
                   </CommandItem>
                 ))}
             </CommandList>
           </Command>
        </div>

        {/* Right Pane: Preview and Actions */}
        {/* Use a slightly darker background in dark mode */}
        <div className="w-1/2 flex flex-col dark:bg-[#171717] bg-white rounded-r-xl h-full">
           {hoveredChat ? (
             <>
               {/* Header */}
               <div className="p-4 border-b dark:border-white/10 border-black/10 flex-shrink-0">
                 {/* Increased title size */}
                 <h3 className="font-medium text-lg truncate">{hoveredChat.title || "Untitled Chat"}</h3>
               </div>

               {/* Message Preview Area */}
               <div className="flex-grow p-4 overflow-y-auto scrollbar-hide text-muted-foreground relative min-h-[100px]">
                 {isPreviewLoading && (
                   <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                   </div>
                 )}
                 {previewError && !isPreviewLoading && (
                   <div className="text-center text-red-500">{previewError}</div>
                 )}
                 {!isPreviewLoading && !previewError && previewMessages && previewMessages.length > 0 && (
                    <div className="space-y-4">
                      {previewMessages.map(msg => (
                         <div key={msg.id} className={`text-sm`}>
                           <span className={`font-semibold mr-2 ${msg.role === 'user' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                             {msg.role === 'user' ? "User:" : msg.role === 'assistant' ? "Assistant:" : "System:"}
                           </span>
                           <span className="text-muted-foreground">
                             {msg.content.length > 150 ? msg.content.substring(0, 150) + '...' : msg.content}
                           </span>
                         </div>
                      ))}
                    </div>
                 )}
                 {!isPreviewLoading && !previewError && (!previewMessages || previewMessages.length === 0) && (
                   <div className="text-center">No preview available.</div>
                 )}
               </div>
             </>
           ) : (
             <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground p-4 h-full">
                <MessageSquareText className="w-10 h-10 mb-4 opacity-30"/>
               <p className="text-center">Hover over a chat on the left to see a preview and actions.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}