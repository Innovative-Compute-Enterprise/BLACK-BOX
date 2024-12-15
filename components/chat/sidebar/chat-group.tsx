"use client";

import { ChatItem } from "./chat-item";

export interface ChatGroupProps {
  group: string;
  chats: {
    id: string;
    title?: string;
    created_at: string;
  }[];
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

export function ChatGroup({
  group,
  chats,
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
}: ChatGroupProps) {
  return (
    <div role="list" aria-label={group}>
      <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
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
          onEditStart={onEditStart}
          onEditSubmit={onEditSubmit}
          onOpenDeleteModal={onOpenDeleteModal}
          isMac={isMac}
        />
      ))}
    </div>
  );
}
