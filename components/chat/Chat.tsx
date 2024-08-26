'use client'
import React, { useState, useRef, useEffect } from 'react';
import MessageDisplay from './MessageDisplay';
import InputArea from './InputArea';
import ChatHistory from './ChatHistory';
import { PanelLeftOpen, X, MessageCirclePlus, Settings } from 'lucide-react';

const Chat = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    // ... (keep the existing logic)
  };

  const loadChatFromHistory = (chatId) => {
    // ... (keep the existing logic)
  };

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  return (
    <div className="relative h-screen">
      <div className="flex h-full">

        {/* Drawer with chat history */}
        <div
          className={`${isDrawerOpen ? 'w-64' : 'w-0 display-none border-none'
            } transition-all duration-300 ease-in-out overflow-hidden bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}
        >
          <ChatHistory
            chatHistory={chatHistory}
            loadChatFromHistory={loadChatFromHistory}
          />
        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                <MessageDisplay messages={messages} />
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
          <div className="p-4">
            <InputArea
              input={input}
              setInput={setInput}
              handleSendMessage={handleSendMessage}
              isSubmitting={isSubmitting}
              model={model}
              setModel={setModel}
            />
          </div>
        </div>
      </div>

      {/* Buttons in top left */}
      <div className="absolute left-3 top-3 z-30 flex space-x-2">
        <button
          onClick={toggleDrawer}
          className="text-gray-600 dark:text-gray-300 p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label={isDrawerOpen ? "Close chat history" : "Open chat history"}
        >
          {isDrawerOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <PanelLeftOpen className="w-6 h-6" />
          )}
        </button>

        <button
          className="text-gray-600 dark:text-gray-300 p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="New chat"
        >
          <MessageCirclePlus className="w-6 h-6" />
        </button>

        <button
          className="text-black dark:text-white p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Chat;