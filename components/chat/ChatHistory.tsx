// src/components/subcomponents/ChatHistoryDrawer.tsx

import React, { useRef, useEffect, useState } from 'react';
import { ChatHistory } from '@/types/chat';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatHistoryDrawerProps {
  chatHistories: ChatHistory[];
  loadChatFromHistory: (id: string) => void;
  currentSessionId: string | null;
  isDrawerOpen: boolean;
  onEditChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
}

const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  chatHistories,
  loadChatFromHistory,
  currentSessionId,
  isDrawerOpen,
  onEditChat,
  onDeleteChat,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistories]);

  if (!isDrawerOpen) return null; // Conditionally render the drawer

  // Sort chats by creation date (newest first)
  const sortedChats = [...chatHistories].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Group chats by date
  const groupedChats = sortedChats.reduce((groups, chat) => {
    const date = new Date(chat.created_at);
    let groupLabel = format(date, 'MMMM dd, yyyy');

    if (isToday(date)) groupLabel = 'Today';
    else if (isYesterday(date)) groupLabel = 'Yesterday';

    if (!groups[groupLabel]) {
      groups[groupLabel] = [];
    }
    groups[groupLabel].push(chat);
    return groups;
  }, {} as Record<string, ChatHistory[]>);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-zinc-200 dark:bg-zinc-900">
      <h2 className="mt-16 text-2xl font-bold px-3">Chat History</h2>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {Object.keys(groupedChats).map((group) => (
          <div key={group}>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {group}
            </h3>
            {groupedChats[group].map((chat) => (
              <div key={chat.id} className="flex items-center justify-between w-full">
                <button
                  onClick={() => loadChatFromHistory(chat.id)}
                  className={`flex-1 text-left p-2 rounded-md text-gray-800 transition-colors 
                    ${chat.id === currentSessionId
                      ? 'bg-gray-300 dark:bg-gray-600'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                    } 
                  `}
                >
                  {/* Display chat title or creation timestamp */}
                  {editingChatId === chat.id ? (
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={() => {
                        if (newTitle.trim()) {
                          onEditChat(chat.id, newTitle.trim());
                        }
                        setEditingChatId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (newTitle.trim()) {
                            onEditChat(chat.id, newTitle.trim());
                          }
                          setEditingChatId(null);
                        }
                      }}
                      className="w-full bg-transparent border-b border-gray-400 focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    chat.title || format(new Date(chat.created_at), 'hh:mm a, MMM dd')
                  )}
                </button>
                <div className="flex space-x-2 ml-2">
                  <button
                    onClick={() => {
                      setEditingChatId(chat.id);
                      setNewTitle(chat.title || '');
                    }}
                    className="p-1 text-blue-500 hover:text-blue-700"
                    title="Edit Chat"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this chat?')) {
                        onDeleteChat(chat.id);
                      }
                    }}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Delete Chat"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {sortedChats.length === 0 && (
          <div className="text-center text-gray-500 mt-10">No previous chats.</div>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryDrawer;