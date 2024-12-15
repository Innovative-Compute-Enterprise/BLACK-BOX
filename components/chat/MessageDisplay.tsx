'use client'
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import MessageRow from './subcomponents/message/messageRow';
import { Message } from '../../types/chat';

interface MessageDisplayProps {
  messages: Message[];
  loadingOlderMessages?: boolean;
  loadOlderMessages?: () => void;
}

// Separate LoadingIndicator component for better organization
const LoadingIndicator: React.FC = React.memo(() => (
  <div className="flex items-center justify-center py-4 space-x-2">
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
  </div>
));

LoadingIndicator.displayName = 'LoadingIndicator';

const MessageDisplay: React.FC<MessageDisplayProps> = React.memo(({
  messages,
  loadingOlderMessages = false,
  loadOlderMessages
}) => {
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const copyTimeoutRef = useRef<NodeJS.Timeout>(); // Use ref for timeout to prevent memory leaks

  const validMessages = useMemo(() => 
    Array.isArray(messages) ? messages : [], 
    [messages]
  );

  // Auto-scroll effect with cleanup
  useEffect(() => {
    if (virtuosoRef.current && validMessages.length > 0 && shouldAutoScroll) {
      virtuosoRef.current.scrollToIndex({
        index: validMessages.length - 1,
        behavior: 'smooth',
        align: 'end',
      });
    }

    // Cleanup function
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, [validMessages, shouldAutoScroll]);

  // Handle scroll events
  const handleScroll = useCallback((atBottom: boolean) => {
    setShouldAutoScroll(atBottom);
  }, []);

  // Enhanced copy handler with timeout cleanup
  const handleCopy = useCallback((id: string) => {
    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    setCopiedId(id);
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  }, []);

  const rowRenderer = useCallback((index: number) => {
    const message = validMessages[index];
    const isLast = index === validMessages.length - 1;
    
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-[572px] 2xl:max-w-2xl 3xl:max-w-3xl my-9">
          <MessageRow
            message={message}
            copiedId={copiedId}
            handleCopy={handleCopy}
            index={index}
            isLast={isLast}
          />
        </div>
      </div>
    );
  }, [validMessages, copiedId, handleCopy]);

  // Loading state components
  const LoadingHeader = useCallback(() => (
    loadingOlderMessages ? <LoadingIndicator /> : <div style={{ height: '64px' }} />
  ), [loadingOlderMessages]);

  const Footer = useCallback(() => (
    <div style={{ height: '72px' }} />
  ), []);

  return (
    <Virtuoso
      ref={virtuosoRef}
      style={{ height: '100%', width: '100%' }}
      totalCount={validMessages.length}
      itemContent={rowRenderer}
      overscan={90}
      className="scrollbar-hide"
      initialTopMostItemIndex={validMessages.length - 1}
      followOutput="smooth"
      atBottomStateChange={handleScroll}
      components={{
        Header: LoadingHeader,
        Footer: Footer
      }}
      startReached={loadOlderMessages}
    />
  );
});

MessageDisplay.displayName = 'MessageDisplay';

export default MessageDisplay;