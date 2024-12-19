// MessageDisplay.tsx
'use client'
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import MessageRow from './subcomponents/message/messageRow';
import { Message } from '../../types/chat';
import { useIsMobile } from "@/hooks/use-mobile"

// Added a lightweight throttle utility to reduce frequent computations on scroll.
function throttle<T extends (...args: any[]) => any>(func: T, limit: number) {
  let inThrottle: boolean;
  let lastFunc: number;
  let lastRan: number;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = window.setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  } as T;
}

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

  // Use refs for stable values that shouldn't trigger re-renders
  const copyTimeoutRef = useRef<NodeJS.Timeout>();
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const isMobile = useIsMobile();

  // --- Dynamic Overscan Calculation ---
  const [overscan, setOverscan] = useState(isMobile ? 50 : 100);

  // Memoize validMessages to avoid recomputing the array reference unnecessarily
  const validMessages = useMemo(
    () => (Array.isArray(messages) ? messages : []),
    [messages]
  );

  // **Performance Enhancement**:
  // Use a callback for the scroll-to-bottom logic to avoid unnecessary triggers.
  // Only scroll to bottom if shouldAutoScroll is true.
  useEffect(() => {
    if (virtuosoRef.current && validMessages.length > 0 && shouldAutoScroll) {
      // This ensures smooth scroll only happens when new messages arrive and user wants auto-scroll.
      virtuosoRef.current.scrollToIndex({
        index: validMessages.length - 1,
        behavior: 'smooth',
        align: 'end',
      });
    }
  }, [validMessages, shouldAutoScroll]);

  // **Performance Enhancement**:
  // handleScroll is stable due to useCallback. Keeps track of bottom state without causing re-renders.
  const handleScroll = useCallback((atBottom: boolean) => {
    setShouldAutoScroll(atBottom);
  }, []);

  // **Performance Enhancement**:
  // handleCopy is stable and avoids creating new timeout handlers on each render.
  const handleCopy = useCallback((id: string) => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    setCopiedId(id);
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  }, []);

  // **Performance Enhancement**:
  // rowRenderer is memoized and only re-created when its dependencies change.
  // This avoids unnecessary item rerenders when not needed.
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

  // Loading states are memoized to avoid unnecessary re-renders
  const LoadingHeader = useCallback(() => (
    loadingOlderMessages ? <LoadingIndicator key="loading" /> : <div style={{ height: '64px' }} />
  ), [loadingOlderMessages]);

  const Footer = useCallback(() => (
    <div style={{ height: '72px' }} />
  ), []);

  // **Performance Enhancement**:
  // Throttle overscan calculations to avoid expensive recomputations on every scroll event.
  // Reduces UI lag when dealing with large message sets.
  useEffect(() => {
    const container = containerRef.current;

    const calculateOverscan = () => {
      if (container) {
        const scrollTop = container.scrollTop;
        const viewportHeight = container.clientHeight;
        const totalHeight = container.scrollHeight;

        // Aggressive reduction in overhead by using a simpler calculation model:
        // Items above and below are roughly estimated. 
        // This ensures minimal complexity but enough adaptation.
        const itemsAbove = Math.max(0, Math.ceil(scrollTop / 200) - 5);
        const itemsBelow = Math.max(0, Math.ceil((totalHeight - scrollTop - viewportHeight) / 200) - 5);
        const safeMargin = isMobile ? 30 : 75;

        // Setting overscan only when needed reduces re-renders of Virtuoso.
        // Using a max here helps keep a stable overscan size.
        const newOverscan = Math.max(safeMargin, itemsAbove, itemsBelow);
        if (newOverscan !== overscan) {
          setOverscan(newOverscan);
        }
      }
    };

    const throttledCalculateOverscan = throttle(calculateOverscan, 200);

    if (container) {
      throttledCalculateOverscan(); // Initial call
      container.addEventListener('scroll', throttledCalculateOverscan);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', throttledCalculateOverscan);
      }
    };
  }, [isMobile, overscan]);

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
