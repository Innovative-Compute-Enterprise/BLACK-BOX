import React, { useRef, useEffect } from 'react';

const ChatHistory = ({ chatHistory, loadChatFromHistory }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <h2 className="text-xl font-semibold p-4 mt-12 text-gray-800 dark:text-gray-200">Chat History</h2>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        {chatHistory.map((chat) => (
          <button
            key={chat.id}
            onClick={() => loadChatFromHistory(chat.id)}
            className="w-full text-left bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 p-2 rounded-md text-gray-800 dark:text-gray-200 transition-colors"
          >
            {new Date(chat.id).toLocaleString()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;