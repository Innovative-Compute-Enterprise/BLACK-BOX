// MessageDisplay.tsx
'use client'
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import MessageRow from './subcomponents/message/messageRow';
import { Message } from '../../types/chat';
import { useIsMobile } from "@/hooks/use-mobile"

interface MessageDisplayProps {
  messages: Message[];
  loadingOlderMessages?: boolean;
  loadOlderMessages?: () => void;
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();
  const isMobile = useIsMobile();

  // --- Dynamic Overscan Calculation ---
  const [overscan, setOverscan] = useState(isMobile ? 50 : 100);

  const validMessages = useMemo(() =>
    Array.isArray(messages) ? messages : [],
    [messages]
  );

  // Auto-scroll effect
  useEffect(() => {
    if (virtuosoRef.current && validMessages.length > 0 && shouldAutoScroll) {
      virtuosoRef.current.scrollToIndex({
        index: validMessages.length - 1,
        behavior: 'smooth',
        align: 'end',
      });
    }
  }, [validMessages, shouldAutoScroll]);

  // Handle scroll events
  const handleScroll = useCallback((atBottom: boolean) => {
    setShouldAutoScroll(atBottom);
  }, []);

  // Enhanced copy handler
  const handleCopy = useCallback((id: string) => {
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
      <div className="flex justify-center mx-6 md:mx-0">
        <div className="w-full max-w-2xl my-9">
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
    loadingOlderMessages ? <LoadingIndicator key="loading" /> : <div style={{ height: '64px' }} />
  ), [loadingOlderMessages]);

  const Footer = useCallback(() => (
    <div style={{ height: '72px' }} />
  ), []);

  // Dynamic overscan calculation
  useEffect(() => {
    const container = containerRef.current;

    const calculateOverscan = () => {
      if (container) {
        const scrollTop = container.scrollTop;
        const viewportHeight = container.clientHeight;
        const totalHeight = container.scrollHeight;

        // --- Refined Estimation ---
        const itemsAbove = Math.max(0, Math.ceil(scrollTop / 200) - 5); // More aggressive reduction
        const itemsBelow = Math.max(0, Math.ceil((totalHeight - scrollTop - viewportHeight) / 200) - 5); // More aggressive reduction
        const safeMargin = isMobile ? 30 : 75; // Reduced safe margin

        setOverscan(Math.max(safeMargin, itemsAbove, itemsBelow));
      }
    };

    if (container) {
      // Initial calculation and then on scroll
      calculateOverscan();
      container.addEventListener('scroll', calculateOverscan);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', calculateOverscan);
      }
    };
  }, [isMobile]);

  return (
    <div ref={containerRef} style={{ height: '100%', overflowY: 'auto' }}>
      <Virtuoso
        ref={virtuosoRef}
        style={{ height: '100%', width: '100%' }}
        totalCount={validMessages.length}
        itemContent={rowRenderer}
        overscan={overscan}
        className="scrollbar-hide"
        initialTopMostItemIndex={validMessages.length - 1}
        followOutput={true}
        atBottomStateChange={handleScroll}
        components={{
          Header: LoadingHeader,
          Footer: Footer
        }}
        startReached={loadOlderMessages}
      />
    </div>
  );
});

MessageDisplay.displayName = 'MessageDisplay';

export default MessageDisplay;