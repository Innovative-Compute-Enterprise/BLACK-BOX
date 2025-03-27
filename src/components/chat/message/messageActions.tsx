import React from 'react';
import { Clipboard, Check } from 'lucide-react';
import { Message, MessageContent } from '@/src/types/chat';

interface MessageActionsProps {
  message: Message;
  copiedId: string | null;
  handleCopy: (id: string) => void;
}

const isTextContent = (content: MessageContent): content is { type: 'text'; text: string } => {
  return content.type === 'text';
};

const getMessageText = (message: Message) => {
  return message.content
    .filter(isTextContent)
    .map(content => content.text)
    .join(' ');
};

const MessageActions: React.FC<MessageActionsProps> = ({ message, copiedId, handleCopy }) => {
  const messageText = getMessageText(message);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      handleCopy(message.id);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="pr-2 message-actions opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      {message.role === 'assistant' && (
        <button
          onClick={copyToClipboard}
          className="rounded-lg transition-colors duration-200"
          aria-label="Copy message"
        >
          {copiedId === message.id ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Clipboard className="h-3.5 w-3.5 text-black/80 dark:text-white/80" />
          )}
        </button>
      )}
    </div>
  );
};

export default MessageActions;