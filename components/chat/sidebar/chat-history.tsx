"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import {
  format,
  isToday,
  isYesterday,
  startOfWeek,
  isWithinInterval,
  endOfDay,
} from "date-fns";
import DeleteModal from "./chat-delete";
import { ChatGroup } from "./chat-group";

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
  onChatSelection: (id: string) => void;
}

function groupChatsByDate(chats: ChatHistory[]): Record<string, ChatHistory[]> {
  return chats.reduce((groups, chat) => {
    const date = new Date(chat.created_at);
    let groupLabel: string;

    if (isToday(date)) {
      groupLabel = "Today";
    } else if (isYesterday(date)) {
      groupLabel = "Yesterday";
    } else {
      const weekStart = startOfWeek(new Date());
      const isThisWeek = isWithinInterval(date, {
        start: weekStart,
        end: endOfDay(new Date()),
      });

      groupLabel = isThisWeek
        ? "This Week"
        : format(date, "MMMM yyyy");
    }

    if (!groups[groupLabel]) {
      groups[groupLabel] = [];
    }
    groups[groupLabel].push(chat);
    return groups;
  }, {} as Record<string, ChatHistory[]>);
}

export function ChatHistory({
  chatHistories = [],
  currentSessionId,
  onEditChat,
  onDeleteChat,
  onChatSelection,
}: ChatHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [isMac, setIsMac] = useState(true);

  // Check platform to show correct hotkeys
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    }
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

  const handleEditSubmit = useCallback(
    async (id: string, title: string) => {
      if (!title.trim()) return;
      setIsEditing(true);
      try {
        await onEditChat(id, title.trim());
        setEditingChatId(null);
      } catch (error) {
        console.error("Failed to edit chat:", error);
      } finally {
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
    if (chatToDelete) {
      onDeleteChat(chatToDelete);
      setIsDeleteModalOpen(false);
      setChatToDelete(null);
    }
  }, [chatToDelete, onDeleteChat]);

  // Focus management
  useEffect(() => {
    if (editingChatId) {
      const inputElement = document.querySelector<HTMLInputElement>('input[type="text"]');
      inputElement?.focus();
    }
  }, [editingChatId]);

  // Scroll to selected chat
  useEffect(() => {
    if (currentSessionId && scrollRef.current) {
      const selectedChat = scrollRef.current.querySelector(
        `[data-chat-id="${currentSessionId}"]`
      );
      selectedChat?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentSessionId]);

  // Keyboard navigation for escaping modals/edit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingChatId) return; // Don't handle when editing
      if (e.key === "Escape") {
        setIsDeleteModalOpen(false);
        setEditingChatId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingChatId]);

  return (
    <div className="flex flex-col h-full px-1" role="region" aria-label="Chat history">
      <div ref={scrollRef} className="scrollbar-hide flex-1 space-y-6">
        {Object.entries(groupedChats).map(([group, chats]) => (
          <ChatGroup
            key={group}
            group={group}
            chats={chats}
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
          />
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
        />
      )}
    </div>
  );
}
