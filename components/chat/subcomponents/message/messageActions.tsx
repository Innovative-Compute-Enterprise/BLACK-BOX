// MessageActions.tsx
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Clipboard, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react';

interface MessageActionsProps {
  message: {
    id: string;
    content: string;
  };
  copiedId: string | null;
  handleCopy: (id: string) => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({ message, copiedId, handleCopy }) => {
  return (
    <div className="fixed space-x-2">
      <CopyToClipboard text={message.content} onCopy={() => handleCopy(message.id)}>
        <button
          className="rounded-full transition-colors duration-200 hover:scale-110"
          aria-label="Copy message"
        >
          {copiedId === message.id ? (
            <span className="text-green-500 text-xs">Copied!</span>
          ) : (
            <Clipboard className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </CopyToClipboard>

      {/* <button
        className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
        aria-label="Thumbs Up"
      >
        <ThumbsUp className="h-4 w-4 text-gray-500" />
      </button>

      <button
        className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
        aria-label="Thumbs Down"
      >
        <ThumbsDown className="h-4 w-4 text-gray-500" />
      </button>

      <button
        className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
        aria-label="More options"
      >
        <MoreHorizontal className="h-4 w-4 text-gray-500" />
      </button> */}
    </div>
  );
};

export default MessageActions;