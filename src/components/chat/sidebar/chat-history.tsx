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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/src/components/shadcn/dropdown-menu";
import DeleteModal from "./chat-delete";
import { usePathname } from "next/navigation";

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
      // Everything else (older than 7 days) falls here
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

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onEditSubmit(chat.id, newTitle);
        e.preventDefault(); // Prevent form submission if applicable
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
        !inputRef.current.contains(event.target as Node)
      ) {
        onEditStart(null);
      }
    },
    [onEditStart]
  );

  useEffect(() => {
    if (editingChatId === chat.id) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [editingChatId, chat.id, handleClickOutside]);

  // Determine if the current chat is active based on the URL
  const isChatActive = useMemo(() => {
    return pathname === `/chat/${chat.id}`;
  }, [pathname, chat.id]);

  return (
    <div
      className={`group/chat relative flex items-center text-md justify-between w-full py-1.5 px-2 rounded-md my-1 ${
        isChatActive || hoveredChatId === chat.id
          ? "bg-gray-200 dark:bg-zinc-700"
          : "hover:bg-gray-200 dark:hover:bg-zinc-900"
      } ${isSelected ? "border-2 border-blue-500" : ""}`}
      data-chat-id={chat.id}
      onMouseEnter={() => setHoveredChatId(chat.id)}
      onMouseLeave={() => {
        // Only reset hover if not the current session
        if (!isChatActive) {
          setHoveredChatId(null);
        }
      }}
    >
      {selectionMode && (
        <div className="mr-2 flex-shrink-0">
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={() => onToggleSelect?.(chat.id)}
            className="h-4 w-4 rounded border-gray-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <button
        onClick={() => {
          if (selectionMode) {
            onToggleSelect?.(chat.id);
          } else {
            onChatSelection(chat.id);
          }
        }}
        className="flex-1 text-left font-light rounded-md transition-colors min-w-0 overflow-hidden"
        aria-label={`Load chat ${
          chat.title || format(new Date(chat.created_at), "PP")
        }`}
        aria-current={chat.id === currentSessionId ? "true" : undefined}
        disabled={isEditing}
      >
        {editingChatId === chat.id ? (
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleEditKeyDown}
            className="w-full bg-transparent rounded-sm border border-gray-300 focus:outline-none text-gray-800 dark:text-gray-200"
            autoFocus
            aria-label="Edit chat title"
          />
        ) : (
          <span className="text-sm whitespace-nowrap overflow-hidden">
            {chat.title}
          </span>
        )}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`p-1 rounded-md flex-shrink-0 ml-1 ${
              hoveredChatId === chat.id ? "opacity-100" : "opacity-0"
            } transition-opacity duration-100`}
            aria-label="Chat options"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3 h-3"
              viewBox="0 0 20 20"
            >
              <g fill="none">
                <path
                  d="M3 6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6z"
                  fill="currentColor"
                ></path>
              </g>
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              onEditStart(chat.id);
              setNewTitle(chat.title || "");
            }}
            disabled={isEditing}
          >
            Edit
            <kbd className="ml-auto text-xs text-black/50 dark:text-white/50">
              {isMac ? "⌘E" : "Ctrl+E"}
            </kbd>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onOpenDeleteModal(chat.id)}
            disabled={isEditing}
          >
            Delete
            <kbd className="ml-auto text-xs text-black/50 dark:text-white/50">
              {isMac ? "⌘D" : "Ctrl+D"}
            </kbd>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);

  // Memoize isMac calculation
  const isMac = useMemo(() => {
    if (typeof navigator !== "undefined") {
      return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    }
    return true; // Default to true if unable to determine
  }, []);

  // Memoize sorted chats
  const sortedChats = useMemo(() => {
    return [...chatHistories].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [chatHistories]);

  // Group the chats by date
  const groupedChats = useMemo(() => {
    return groupChatsByDate(sortedChats);
  }, [sortedChats]);

  // Simplified handleEditSubmit
  const handleEditSubmit = useCallback(
    async (id: string, title: string) => {
      if (!title.trim()) return;
      setIsEditing(true);
      try {
        await onEditChat(id, title.trim());
      } catch (error) {
        console.error("Failed to edit chat:", error);
      } finally {
        setEditingChatId(null);
        setIsEditing(false);
      }
    },
    [onEditChat]
  );

  const openDeleteModal = useCallback((id: string) => {
    setChatToDelete(id);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectionMode && selectedChats.length > 0 && onMultiDeleteChat) {
      onMultiDeleteChat(selectedChats);
      setIsDeleteModalOpen(false);
      setSelectedChats([]);
      setSelectionMode(false);
    } else if (chatToDelete) {
      onDeleteChat(chatToDelete);
      setIsDeleteModalOpen(false);
      setChatToDelete(null);
    }
  }, [chatToDelete, onDeleteChat, selectionMode, selectedChats, onMultiDeleteChat]);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      setSelectedChats([]);
    }
  }, [selectionMode]);

  const toggleSelectChat = useCallback((id: string) => {
    setSelectedChats(prev => 
      prev.includes(id) 
        ? prev.filter(chatId => chatId !== id)
        : [...prev, id]
    );
  }, []);

  const handleMultiDeleteClick = useCallback(() => {
    if (selectedChats.length > 0) {
      setIsDeleteModalOpen(true);
    }
  }, [selectedChats]);

  // Focus management
  useEffect(() => {
    if (editingChatId) {
      const inputElement =
        document.querySelector<HTMLInputElement>('input[type="text"]');
      inputElement?.focus();
    }
  }, [editingChatId]);

  // Optimized Scroll to selected chat
  useEffect(() => {
    if (currentSessionId && scrollRef.current) {
      const selectedChat = scrollRef.current.querySelector(
        `[data-chat-id="${currentSessionId}"]`
      );
      if (selectedChat) {
        selectedChat.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentSessionId]);

  // Optimized Keyboard navigation useEffect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingChatId) return; // Don't handle when editing
      if (e.key === "Escape") {
        setIsDeleteModalOpen(false);
        setEditingChatId(null);
        if (selectionMode) {
          setSelectionMode(false);
          setSelectedChats([]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingChatId, selectionMode]);

  return (
    <div className="flex flex-col h-full">
      <div className="pb-2 px-2 flex justify-between items-center">
        <h2 className="text-sm font-semibold">Chat History</h2>
        <div className="flex space-x-2">
          <button 
            onClick={toggleSelectionMode}
            className={`p-1 rounded-md text-xs ${selectionMode ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            aria-label={selectionMode ? "Exit selection mode" : "Select multiple chats"}
          >
            {selectionMode ? "Cancel" : "Select"}
          </button>
          
          {selectionMode && selectedChats.length > 0 && (
            <button 
              onClick={handleMultiDeleteClick}
              className="p-1 rounded-md text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              aria-label="Delete selected chats"
            >
              Delete ({selectedChats.length})
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-hide flex-1 space-y-9 overflow-auto"
      >
        {Object.entries(groupedChats).map(([group, chats]) => (
          <div key={group} role="list" aria-label={group}>
            <h3 className="text-[12px] font-bold text-black/50 dark:text-white/50 mb-1 px-2">
              {group}
            </h3>
            {chats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                currentSessionId={currentSessionId}
                editingChatId={editingChatId}
                newTitle={newTitle}
                setNewTitle={setNewTitle}
                hoveredChatId={hoveredChatId}
                setHoveredChatId={setHoveredChatId}
                isEditing={isEditing}
                onChatSelection={onChatSelection}
                onEditStart={setEditingChatId}
                onEditSubmit={handleEditSubmit}
                onOpenDeleteModal={openDeleteModal}
                isMac={isMac}
                isSelected={selectedChats.includes(chat.id)}
                onToggleSelect={toggleSelectChat}
                selectionMode={selectionMode}
              />
            ))}
          </div>
        ))}

        {sortedChats.length === 0 && (
          <div className="text-center text-gray-500 mt-10" role="status">
            No previous chats.
          </div>
        )}
      </div>

      {isDeleteModalOpen && (
        <DeleteModal
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          confirmDelete={confirmDelete}
          multiDelete={selectionMode && selectedChats.length > 0}
          count={selectionMode ? selectedChats.length : 1}
        />
      )}
    </div>
  );
}
