// src/components/subcomponents/ChatHistoryDrawer.tsx

import React, { useRef, useEffect, useState } from 'react';
import { ChatHistory } from '@/types/chat';
import { format, isToday, isYesterday } from 'date-fns';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

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

  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistories]);

  if (!isDrawerOpen) return null;

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

  const openDeleteModal = (id: string) => {
    setChatToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      // TODO: Add loading state while deleting a chat
      onDeleteChat(chatToDelete);
      setIsDeleteModalOpen(false);
      setChatToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto dark:bg-[#0E0E0E]/70 bg-[#F1F1F1]/70 dark:border-[#ffffff]/10 border-black/10 border-r backdrop-blur-lg shadow-lg">
      <h2 className="mt-24 text-2xl font-semibold px-4 text-gray-800 dark:text-gray-200">Chat History</h2>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {Object.keys(groupedChats).map((group) => (
          <div key={group}>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-6">
              {group}
            </h3>
            {groupedChats[group].map((chat) => (
              <div key={chat.id} className="flex items-center justify-between w-full my-2">
                <button
                  onClick={() => loadChatFromHistory(chat.id)}
                  className={`flex-1 text-left p-2 rounded-md transition-colors 
                    ${chat.id === currentSessionId
                      ? 'bg-blue-100 dark:bg-blue-700'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } 
                  `}
                  aria-label={`Load chat ${chat.title}`}
                >
                  {/* 
                    TODO: Add loading state when loading a specific chat history.
                    For example, display a spinner or skeleton while the chat is being loaded.
                  */}
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
                      className="w-full bg-transparent border-b border-gray-300 focus:outline-none text-gray-800 dark:text-gray-200"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate">
                      {chat.title || format(new Date(chat.created_at), 'hh:mm a, MMM dd')}
                    </span>
                  )}
                </button>

                {/* Action Menu */}
                <Menu as="div" className="relative ml-3">
                  <MenuButton className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors rounded-md focus:outline-none">
                    {/* Menu Button Icon */}
                    <svg
                      className="w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="sr-only">Open menu</span>
                  </MenuButton>

                  <MenuItems className="absolute right-0 mt-2 w-28 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg focus:outline-none z-20">
                    <MenuItem>
                      {({ active }) => (
                        <button
                          onClick={() => {
                            setEditingChatId(chat.id);
                            setNewTitle(chat.title || '');
                            // TODO: Add loading state while editing a chat title
                          }}
                          className={`w-full text-left px-4 py-2 text-sm ${active
                              ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-200'
                            }`}
                        >
                          Edit
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ active }) => (
                        <button
                          onClick={() => openDeleteModal(chat.id)}
                          className={`w-full text-left px-4 py-2 text-sm ${active
                              ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-200'
                            }`}
                        >
                          Delete
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>
            ))}
          </div>
        ))}

        {sortedChats.length === 0 && (
          <div className="text-center text-gray-500 mt-10">No previous chats.</div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed z-30 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black opacity-50"></div>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-sm sm:w-full z-40">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                  Confirm Deletion
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Are you sure you want to delete this chat? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={confirmDelete}
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistoryDrawer;
