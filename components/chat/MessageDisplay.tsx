// src/components/chat/MessageDisplay.tsx

import React, { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

interface MessageDisplayProps {
  messages: Message[];
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ messages }) => {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessageContent, setEditedMessageContent] = useState<string>('');

  // const handleEditMessage = (messageId: string, messageContent: string) => {
  //   setEditingMessageId(messageId);
  //   setEditedMessageContent(messageContent);
  // };

  const handleSaveEdit = (messageId: string) => {
    console.log('Saving edited message:', messageId, editedMessageContent);
    setEditingMessageId(null);
    // Implement the save logic here
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedMessageContent('');
  };

  // Ensure messages is always an array
  const validMessages = Array.isArray(messages) ? messages : [];

  // Debugging: Log the messages to verify IDs
  useEffect(() => {
    console.log('Messages:', validMessages);
  }, [validMessages]);

  return (
    <div className="flex flex-col space-y-12">
      {validMessages.map((message, index) => {
        // Check if message.id exists and is unique
        if (!message.id) {
          console.warn(`Message at index ${index} is missing an 'id' property.`);
        }

        return (
          <div
            key={message.id || index} // Fallback to index if id is missing
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl p-3 ${
                message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'
              }`}
            >
              <p className="mb-2">{message.content}</p>
              <div className="flex justify-end space-x-2 text-xs">
                <CopyToClipboard text={message.content}>
                  <button className="hover:underline">Copy</button>
                </CopyToClipboard>
                {/* Edit functionality (currently not implemented) */}
                {/* Uncomment to enable the Edit feature */}
                {/* {message.role === 'user' && (
                  <button onClick={() => handleEditMessage(message.id, message.content)} className="hover:underline">
                    Edit
                  </button>
                )} */}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageDisplay;