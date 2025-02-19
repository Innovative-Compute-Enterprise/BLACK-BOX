'use client'

import React, {
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
  useLayoutEffect
} from 'react'
import { Message } from '../../types/chat'
import MessageRow from './message/messageRow'
import LoadingSpinner from './message/loading'

interface MessageDisplayProps {
  messages: Message[]
  loadingOlderMessages?: boolean
  loadOlderMessages?: () => void
}

const CHUNK_SIZE = 30

const MessageDisplay: React.FC<MessageDisplayProps> = React.memo(({
  messages,
  loadingOlderMessages = false,
  loadOlderMessages
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [renderCount, setRenderCount] = useState(CHUNK_SIZE)
  const footerRef = useRef<HTMLDivElement | null>(null)

  // Memoize validMessages
  const validMessages = useMemo(
    () => (Array.isArray(messages) ? messages : []),
    [messages]
  );

  const handleCopy = useCallback((id: string) => {
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    setCopiedId(id);
    copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 1000);
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    if (containerRef.current.scrollTop < 100 && renderCount < validMessages.length) {
      if (loadOlderMessages) {
        loadOlderMessages();
      }
      setRenderCount(prev => Math.min(prev + CHUNK_SIZE, validMessages.length));
    }
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setShouldAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  }, [renderCount, validMessages.length, loadOlderMessages]);

  // On mount, force scroll to bottom.
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  // On new messages, wait until the layout has updated then scroll.
  useLayoutEffect(() => {
    // Use requestAnimationFrame to ensure that the DOM is fully rendered.
    requestAnimationFrame(() => {
      if (footerRef.current && shouldAutoScroll) {
        footerRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }, [validMessages, shouldAutoScroll]);

  // Use only the latest renderCount messages
  const startIndex = Math.max(validMessages.length - renderCount, 0);
  const renderedMessages = validMessages.slice(startIndex);

  // Row renderer (unchanged)
  const rowRenderer = useCallback(
    (index: number) => {
      const message = validMessages[index];
      const isLast = index === validMessages.length - 1;
      const isAssistant = message?.role === 'assistant';

      return (
        <div key={message.id} className="w-full max-w-2xl mx-auto lg:px-0 px-3" 
             // Consider removing contentVisibility if you suspect deferred rendering
             style={{ /* contentVisibility: 'auto' */ }}>
          <div className="flex flex-col md:flex-row">
            <div className="flex-grow w-full" style={{ flexBasis: '0' }}>
              <MessageRow
                message={message}
                copiedId={copiedId}
                handleCopy={handleCopy}
                index={index}
                isLast={isLast}
              />
            </div>
          </div>
        </div>
      );
    },
    [validMessages, copiedId, handleCopy]
  );

  const LoadingHeader = useCallback(() => {
    if (loadingOlderMessages) {
      return <LoadingSpinner />;
    }
    return <div className="h-20" />;
  }, [loadingOlderMessages]);

  // Footer with ref attached
  const Footer = useCallback(() => {
    return <div className="h-12" ref={footerRef} />;
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex flex-col h-full w-full bg-background overflow-y-auto z-10"
    >
      <div className="flex justify-center items-center h-16">
        <LoadingHeader />
      </div>
      {renderedMessages.map((message, i) => {
        const actualIndex = startIndex + i;
        return rowRenderer(actualIndex);
      })}
      <Footer />
    </div>
  );
});

MessageDisplay.displayName = 'MessageDisplay';
export default MessageDisplay;
