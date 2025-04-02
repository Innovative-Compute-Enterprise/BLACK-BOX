"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { format } from "date-fns";
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Check,
  X,
  MessageSquare,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/shadcn/tooltip";
import { Button } from "@/src/components/shadcn/button";
import { Input } from "@/src/components/shadcn/input";
import DeleteModal from "./chat-delete";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";

export interface ChatHistory {
  id: string;
  title?: string;
  created_at: string;
}

export interface ChatHistoryProps {
  chatHistories: ChatHistory[];
  currentSessionId: string | null;
  onEditChat: (id: string, newTitle: string) => Promise<void>;
  onDeleteChat: (id: string) => void;
  onMultiDeleteChat?: (ids: string[]) => void;
  onChatSelection: (id: string) => void;
}

function groupChatsByDate(chats: ChatHistory[]): Record<string, ChatHistory[]> {
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfYesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1
  );
  const last7Days = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 7
  );

  return chats.reduce((groups, chat) => {
    const chatDate = new Date(chat.created_at);

    let groupLabel: string;

    if (chatDate >= startOfToday) {
      groupLabel = "Today";
    } else if (chatDate >= startOfYesterday) {
      groupLabel = "Yesterday";
    } else if (chatDate >= last7Days) {
      groupLabel = "Last 7 days";
    } else {
      groupLabel = "Last 30 days";
    }

    if (!groups[groupLabel]) {
      groups[groupLabel] = [];
    }
    groups[groupLabel].push(chat);
    return groups;
  }, {} as Record<string, ChatHistory[]>);
}

function ChatItem({
  chat,
  currentSessionId,
  editingChatId,
  newTitle,
  setNewTitle,
  hoveredChatId,
  setHoveredChatId,
  isEditing,
  onChatSelection,
  onEditStart,
  onEditSubmit,
  onOpenDeleteModal,
  isMac,
  isSelected,
  onToggleSelect,
  selectionMode,
}: {
  chat: ChatHistory;
  currentSessionId: string | null;
  editingChatId: string | null;
  newTitle: string;
  setNewTitle: React.Dispatch<React.SetStateAction<string>>;
  hoveredChatId: string | null;
  setHoveredChatId: React.Dispatch<React.SetStateAction<string | null>>;
  isEditing: boolean;
  onChatSelection: (id: string) => void;
  onEditStart: (id: string | null) => void;
  onEditSubmit: (id: string, title: string) => void;
  onOpenDeleteModal: (id: string) => void;
  isMac: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectionMode: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onEditSubmit(chat.id, newTitle.trim() || "Untitled Chat");
        e.preventDefault();
      } else if (e.key === "Escape") {
        onEditStart(null);
      }
    },
    [chat.id, newTitle, onEditSubmit, onEditStart]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        editingChatId === chat.id
      ) {
        onEditStart(null);
      }
    },
    [onEditStart, editingChatId, chat.id]
  );

  useEffect(() => {
    if (editingChatId === chat.id) {
      inputRef.current?.focus();
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [editingChatId, chat.id, handleClickOutside]);

  const isChatActive = useMemo(() => {
    return currentSessionId === chat.id;
  }, [currentSessionId, chat.id]);

  const displayTitle = chat.title || `Chat from ${format(new Date(chat.created_at), "PP")}`;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "group/chat relative flex items-center text-sm justify-between w-full py-1 px-2 rounded-md my-0.5 transition-colors duration-150",
          isChatActive
            ? "bg-gray-200 dark:bg-zinc-700 font-medium"
            : "hover:bg-gray-100 dark:hover:bg-zinc-800",
          isSelected && !isChatActive
            ? "bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500"
            : ""
        )}
        data-chat-id={chat.id}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {selectionMode && (
          <div className="mr-2 flex-shrink-0">
            <input
              type="checkbox"
              checked={!!isSelected}
              onChange={() => onToggleSelect?.(chat.id)}
              className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select chat ${displayTitle}`}
            />
          </div>
        )}

        <button
          onClick={() => {
            if (isEditing) return;
            if (selectionMode) {
              onToggleSelect?.(chat.id);
            } else {
              onChatSelection(chat.id);
            }
          }}
          className="flex-1 text-left rounded-md transition-colors min-w-0 overflow-hidden h-8 flex items-center"
          aria-label={`Load chat: ${displayTitle}`}
          aria-current={isChatActive ? "page" : undefined}
          disabled={isEditing && editingChatId === chat.id}
        >
          {editingChatId === chat.id ? (
            <Input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={() => {
                setTimeout(() => {
                  if (editingChatId === chat.id) {
                    onEditSubmit(chat.id, newTitle.trim() || "Untitled Chat");
                  }
                }, 100);
              }}
              className="h-7 text-sm px-1 py-0 w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 dark:text-gray-200 rounded"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              aria-label="Edit chat title"
            />
          ) : (
            <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis pr-1">
              {displayTitle}
            </span>
          )}
        </button>

        {!isEditing && (isHovered || isChatActive || isSelected) && !selectionMode && (
           <div className="flex items-center flex-shrink-0 ml-1 space-x-0.5">
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button
                   variant="ghost"
                   size="icon"
                   className="h-6 w-6 p-0 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                   onClick={(e) => {
                     e.stopPropagation();
                     onEditStart(chat.id);
                     setNewTitle(chat.title || "");
                   }}
                   aria-label="Edit chat title"
                 >
                   <Edit size={14} />
                 </Button>
               </TooltipTrigger>
               <TooltipContent side="top">Edit Title</TooltipContent>
             </Tooltip>
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button
                   variant="ghost"
                   size="icon"
                   className="h-6 w-6 p-0 text-red-500 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                   onClick={(e) => {
                     e.stopPropagation();
                     onOpenDeleteModal(chat.id);
                   }}
                   aria-label="Delete chat"
                 >
                   <Trash2 size={14} />
                 </Button>
               </TooltipTrigger>
               <TooltipContent side="top">Delete Chat</TooltipContent>
             </Tooltip>
           </div>
         )}
        {!isEditing && !(isHovered || isChatActive || isSelected) && !selectionMode && (
          <div className="flex items-center flex-shrink-0 ml-1 space-x-0.5 h-6 w-[calc(1.5rem*2+0.125rem)]">
            &nbsp;
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export function ChatHistory({
  chatHistories = [],
  currentSessionId,
  onEditChat,
  onDeleteChat,
  onMultiDeleteChat,
  onChatSelection,
}: ChatHistoryProps) {
  const [isClient, setIsClient] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsClient(true);
    setIsMac(navigator.userAgent.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  const sortedChats = useMemo(() => {
    return [...chatHistories].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [chatHistories]);

  const groupedChats = useMemo(
    () => (isClient ? groupChatsByDate(sortedChats) : {}),
    [sortedChats, isClient]
  );

  const handleEditStart = useCallback((id: string | null) => {
    setEditingChatId(id);
    if (id) {
      const chat = chatHistories.find((c) => c.id === id);
      setNewTitle(chat?.title || "");
    } else {
      setNewTitle("");
    }
  }, [chatHistories]);

  const handleEditSubmit = useCallback(
    async (id: string, title: string) => {
      const trimmedTitle = title.trim();
      if (trimmedTitle) {
        await onEditChat(id, trimmedTitle);
      }
      handleEditStart(null);
    },
    [onEditChat, handleEditStart]
  );

  const handleOpenDeleteModal = useCallback((id: string) => {
    setChatToDelete(id);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (chatToDelete) {
      onDeleteChat(chatToDelete);
      setChatToDelete(null);
    }
    setIsDeleteModalOpen(false);
  }, [chatToDelete, onDeleteChat]);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => !prev);
    setSelectedChatIds(new Set());
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedChatIds((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      if (newSelection.size === 0) {
        setSelectionMode(false);
      }
      return newSelection;
    });
  }, []);

  const handleMultiDelete = useCallback(() => {
    if (onMultiDeleteChat && selectedChatIds.size > 0) {
      onMultiDeleteChat(Array.from(selectedChatIds));
      setSelectedChatIds(new Set());
      setSelectionMode(false);
    }
  }, [onMultiDeleteChat, selectedChatIds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingChatId) {
          handleEditStart(null);
        } else if (selectionMode) {
          toggleSelectionMode();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingChatId, handleEditStart, selectionMode, toggleSelectionMode]);

  useEffect(() => {
    if (currentSessionId) {
      setHoveredChatId(currentSessionId);
    }
  }, [currentSessionId]);

  const groupOrder = ["Today", "Yesterday", "Last 7 days", "Last 30 days"];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full">
        <div className="flex justify-end px-2 mb-1 h-8 items-center">
           {chatHistories.length > 0 && onMultiDeleteChat && (
             <Button
               variant="ghost"
               size="sm"
               onClick={toggleSelectionMode}
               className="text-xs h-7 px-2"
             >
               {selectionMode ? "Cancel" : "Select"}
             </Button>
           )}
         </div>

        {selectionMode && (
          <div className="flex justify-between items-center px-2 py-1 border-b border-gray-200 dark:border-zinc-700 mb-1">
            <span className="text-xs font-medium">{selectedChatIds.size} selected</span>
            <div className="flex items-center space-x-1">
               <Tooltip>
                 <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"
                      onClick={handleMultiDelete}
                      disabled={selectedChatIds.size === 0}
                      aria-label="Delete selected chats"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Delete Selected</TooltipContent>
                </Tooltip>
               <Tooltip>
                 <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                      onClick={toggleSelectionMode}
                      aria-label="Cancel selection"
                    >
                      <X size={16} />
                    </Button>
                 </TooltipTrigger>
                 <TooltipContent side="bottom">Cancel</TooltipContent>
               </Tooltip>
             </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1">
          {isClient && chatHistories.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 px-4">
               <MessageSquare size={32} className="mb-2" />
               <p className="text-sm">No chat history yet.</p>
               <p className="text-xs mt-1">Start a new conversation!</p>
             </div>
           ) : (
            groupOrder.map((groupLabel) =>
              groupedChats[groupLabel] ? (
                <div key={groupLabel} className="mb-2 last:mb-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 sticky top-0 bg-sidebar z-10">
                    {groupLabel}
                  </p>
                  {groupedChats[groupLabel].map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      currentSessionId={currentSessionId}
                      editingChatId={editingChatId}
                      newTitle={newTitle}
                      setNewTitle={setNewTitle}
                      hoveredChatId={hoveredChatId}
                      setHoveredChatId={setHoveredChatId}
                      isEditing={editingChatId === chat.id}
                      onChatSelection={onChatSelection}
                      onEditStart={handleEditStart}
                      onEditSubmit={handleEditSubmit}
                      onOpenDeleteModal={handleOpenDeleteModal}
                      isMac={isMac}
                      isSelected={selectedChatIds.has(chat.id)}
                      onToggleSelect={handleToggleSelect}
                      selectionMode={selectionMode}
                    />
                  ))}
                </div>
              ) : null
            )
          )}
        </div>

        {/* Conditionally render Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <DeleteModal
            setIsDeleteModalOpen={setIsDeleteModalOpen}
            confirmDelete={handleConfirmDelete}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
