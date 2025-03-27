"use client";

import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useEffect,
} from "react";
import { Message } from "../../types/chat";
import MessageRow from "./message/messageRow";
import LoadingSpinner from "./message/loading";

interface MessageDisplayProps {
  messages: Message[];
  loadingOlderMessages?: boolean;
  loadOlderMessages?: () => void;
}

const CHUNK_SIZE = 30;

const MessageDisplay: React.FC<MessageDisplayProps> = React.memo(
  ({ messages, loadingOlderMessages = false, loadOlderMessages }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const footerRef = useRef<HTMLDivElement | null>(null);

    const [renderCount, setRenderCount] = useState(() => messages.length);

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

      if (
        containerRef.current.scrollTop < 100 &&
        renderCount < validMessages.length
      ) {
        if (loadOlderMessages) {
          loadOlderMessages();
        }
        setRenderCount((prev) =>
          Math.min(prev + CHUNK_SIZE, validMessages.length)
        );
      }
    }, [renderCount, validMessages.length, loadOlderMessages]);

    useLayoutEffect(() => {
      if (!containerRef.current) return;
    
      requestAnimationFrame(() => {
        // Add this additional null check inside the callback
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      });
    }, [validMessages.length]);

    useEffect(() => {
      setRenderCount(validMessages.length);
    }, [validMessages.length]);

    const messagesToRender = useMemo(() => {
      const startIndex = Math.max(0, validMessages.length - renderCount);
      return validMessages.slice(startIndex);
    }, [validMessages, renderCount]);

    const rowRenderer = useCallback(
      (message: Message, index: number) => {
        const actualIndex = validMessages.indexOf(message);
        const isLast = index === messagesToRender.length - 1;

        return (
          <div
            key={message.id}
            className="w-full max-w-2xl mx-auto lg:px-0 px-3"
            data-message-id={message.id}
          >
            <div className="flex flex-col md:flex-row">
              <div className="flex-grow w-full" style={{ flexBasis: "0" }}>
                <MessageRow
                  message={message}
                  copiedId={copiedId}
                  handleCopy={handleCopy}
                  index={actualIndex}
                  isLast={isLast}
                />
              </div>
            </div>
          </div>
        );
      },
      [validMessages, copiedId, handleCopy, messagesToRender.length]
    );

    const LoadingHeader = useCallback(() => {
      if (loadingOlderMessages) {
        return <LoadingSpinner />;
      }
      return <div className="h-20" />;
    }, [loadingOlderMessages]);

    const Footer = useCallback(() => {
      return <div className="h-16" ref={footerRef} />;
    }, []);

    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex flex-col h-full w-full bg-background overflow-y-scroll scroll-container overscroll-none 
              [&::-webkit-scrollbar]:hidden 
              -webkit-overflow-scrolling:auto"
        style={{ height: "calc(100vh - 160px)" }}
      >
        <div className="flex justify-center items-center h-16">
          <LoadingHeader />
        </div>
        <div className="flex-grow flex flex-col">
          {messagesToRender.map((message, i) => rowRenderer(message, i))}
        </div>
        <Footer />
      </div>
    );
  }
);

MessageDisplay.displayName = "MessageDisplay";
export default MessageDisplay;
