// components/subcomponents/message/MessageRow.tsx
import React, { useEffect, useState } from 'react';
import MessageBubble from './messageBubble';
import MessageActions from './messageActions';
import LoadingSpinner from './loading';

interface MessageRowProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    pending?: boolean;
    displayedContent?: string;
  };
  copiedId?: string | null;
  handleCopy: (id: string) => void;
}

const TYPING_SPEED = 50; // Milliseconds per character

const MessageRow: React.FC<MessageRowProps> = ({ message, copiedId, handleCopy }) => {
  const isUser = message.role === 'user';
  const [currentContent, setCurrentContent] = useState<string>(
    message.displayedContent || ''
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      message.role === 'assistant' &&
      !message.pending &&
      currentContent === '' &&
      message.content
    ) {
      let currentIndex = 0;
      interval = setInterval(() => {
        setCurrentContent((prev) => prev + message.content[currentIndex]);
        currentIndex += 1;

        if (currentIndex >= message.content.length) {
          clearInterval(interval);
        }
      }, TYPING_SPEED);
    } else if (message.role === 'assistant' && message.pending) {
      // If the message is pending, display nothing (loading spinner will handle it)
      setCurrentContent('');
    } else {
      // For user messages or fully loaded assistant messages, display content immediately
      setCurrentContent(message.content);
    }

    return () => clearInterval(interval);
  }, [message, currentContent]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative inline-block`}>
        {message.role === 'assistant' && message.pending ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : (
          <MessageBubble message={{ ...message, content: currentContent }} />
        )}
        <div className="mt-2">
          <MessageActions
            message={message}
            copiedId={copiedId}
            handleCopy={handleCopy}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageRow;
