import React from 'react';

const MessageDisplay = ({ messages }) => (
  <div className="h-auto p-8 space-y-4">
    {messages.map((message, index) => (
      <div
        key={index}
        className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[70%] rounded-lg p-3 shadow ${
            message.sender === 'You'
              ? 'bg-gray-700 dark:bg-gray-600 text-white'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
          }`}
        >
          <p className="text-sm font-semibold mb-1">{message.sender}</p>
          <p>{message.content}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    ))}
  </div>
);

export default MessageDisplay;