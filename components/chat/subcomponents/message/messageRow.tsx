'use client'

import React, { useEffect, useState, useRef } from 'react';
import GraphemeSplitter from 'grapheme-splitter';
import MessageBubble from './messageBubble';
import MessageActions from './messageActions';
import LoadingSpinner from './loading';
import { Message, MessageContent } from '@/types/chat';

interface MessageRowProps {
  message: Message;
  copiedId?: string | null;
  handleCopy: (id: string) => void;
  index: number;
  isLast: boolean;
}

const TYPING_SPEED = 3;

const MessageRow: React.FC<MessageRowProps> = ({
  message,
  copiedId,
  handleCopy,
  isLast,
}) => {
  const isUser = message.role === 'user';
  const [currentContent, setCurrentContent] = useState<MessageContent[]>([]);
  const animationRef = useRef<NodeJS.Timeout>();

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset typing state when message changes
    if (!isUser) {
      setCurrentContent([]);
    }
  }, [message.content, isUser]);

  useEffect(() => {
    // Only animate if the message is from the assistant and still pending
    const shouldAnimate = message.role === 'assistant' && message.pending && isLast;
    if (shouldAnimate) {
      let contentIndex = 0;
      let charIndex = 0;
      let accumulatedContent: MessageContent[] = [];
      const splitter = new GraphemeSplitter();

      const typeNextCharacter = () => {
        if (contentIndex >= message.content.length) {
          // Typing completed, clear pending flag
          return;
        }

        const currentItem = message.content[contentIndex];

        if (currentItem.type !== 'text') {
          // Handle non-text content immediately
          accumulatedContent = [...accumulatedContent, currentItem];
          setCurrentContent([...accumulatedContent]);
          contentIndex++;
          animationRef.current = setTimeout(typeNextCharacter, TYPING_SPEED);
          return;
        }

        const characters = splitter.splitGraphemes(currentItem.text);

        if (charIndex < characters.length) {
          const currentText = characters.slice(0, charIndex + 1).join('');
          accumulatedContent = [
            ...accumulatedContent.slice(0, contentIndex),
            { type: 'text', text: currentText },
          ];
          setCurrentContent([...accumulatedContent]);
          charIndex++;
        } else {
          contentIndex++;
          charIndex = 0;
        }

        animationRef.current = setTimeout(typeNextCharacter, TYPING_SPEED);
      };

      // Start the animation
      typeNextCharacter();
    } else if (message.role === 'assistant' && !message.pending) {
      // If the message is not pending anymore, just display it
      setCurrentContent(message.content);
    } else if (message.role === 'user') {
      // For user messages, display immediately
      setCurrentContent(message.content);
    }
  }, [message, isLast]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative inline-block w-full ${isUser ? 'flex justify-end' : 'justify-start'}`}>
        {message.role === 'assistant' && message.pending ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : (
          <MessageBubble
            message={{
              ...message,
              content: currentContent,
              pending: message.pending
            }}
          />
        )}
        {!isUser && (
          <MessageActions
            message={message}
            copiedId={copiedId}
            handleCopy={handleCopy}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(MessageRow);