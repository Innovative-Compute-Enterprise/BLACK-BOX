import React, { useMemo, useRef, useEffect, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';
import MessageRow from './subcomponents/message/messageRow';

interface Message {
  id: string;
  content: string;
  displayedContent?: string;
  role: 'user' | 'assistant';
  pending?: boolean;
}

interface MessageDisplayProps {
  messages: Message[];
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ messages }) => {
  const listRef = useRef<List>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const rowHeights = useRef<{ [key: number]: number }>({});

  const validMessages = useMemo(() => {
    return Array.isArray(messages) ? messages : [];
  }, [messages]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(validMessages.length - 1, 'end');
    }
  }, [validMessages]);

  const getItemSize = (index: number) => {
    return rowHeights.current[index] || 50;
  };

  const setRowHeight = (index: number, size: number) => {
    if (rowHeights.current[index] !== size) {
      rowHeights.current[index] = size;
      listRef.current?.resetAfterIndex(index);
    }
  };

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const message = validMessages[index];
    const isFirst = index === 0;
    const isLast = index === validMessages.length - 1;

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.clientHeight);
      }
    }, [message, index]);

    // Apply different styles or classes if the message is first or last
    const rowClassName = `flex justify-center py-6 ${
      isFirst ? 'pt-24' : isLast ? 'pb-32' : ''
    }`;

    return (
      <div style={style}>
        <div ref={rowRef} className={rowClassName}>
          <div className="w-full max-w-2xl 2xl:max-w-3xl">
            <MessageRow
              message={message}
              copiedId={copiedId}
              handleCopy={handleCopy}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          itemCount={validMessages.length}
          itemSize={getItemSize}
          ref={listRef}
          className="scrollbar-hide"
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
};

export default MessageDisplay;