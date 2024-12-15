"use client";

import { useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";

export interface ChatItemProps {
  chat: {
    id: string;
    title?: string;
    created_at: string;
  };
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
}

export function ChatItem({
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
}: ChatItemProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onEditSubmit(chat.id, newTitle);
      } else if (e.key === "Escape") {
        onEditStart(null);
      }
    },
    [chat.id, newTitle, onEditSubmit, onEditStart]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        onEditStart(null);
      }
    },
    [onEditStart]
  );

  useEffect(() => {
    if (editingChatId === chat.id) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingChatId, chat.id, handleClickOutside]);

  return (
    <div
      className={`flex items-center justify-between w-full p-1.5 rounded-md ${
        chat.id === currentSessionId || hoveredChatId === chat.id
          ? "bg-gray-100 dark:bg-zinc-800"
          : "hover:bg-gray-100 dark:hover:bg-zinc-800"
      }`}
      data-chat-id={chat.id}
      onMouseEnter={() => setHoveredChatId(chat.id)}
      onMouseLeave={() => setHoveredChatId(null)}
    >
      <button
        onClick={() => onChatSelection(chat.id)}
        className={`flex-1 text-left p-1 rounded-md transition-colors ${
          chat.id === currentSessionId ? "bg-blue-100 dark:bg-blue-700" : ""
        }`}
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
          <span className="truncate text-sm whitespace-nowrap">
            {chat.title || format(new Date(chat.created_at), "hh:mm a")}
          </span>
        )}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`p-1 rounded-md ${
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
