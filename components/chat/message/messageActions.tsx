import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Clipboard, Check } from 'lucide-react';
import { Message, MessageContent } from '@/types/chat';

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

  return (
    <div className="space-x-2">
      {message.role === 'assistant' && ( // Check if the message is from the assistant
        <CopyToClipboard text={messageText} onCopy={() => handleCopy(message.id)}>
          <button
            className="rounded-lg p-1.5 transition-colors duration-200"
            aria-label="Copy message"
          >
            {copiedId === message.id ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Clipboard className="h-3.5 w-3.5 text-black/80 dark:text-white/80" />
            )}
          </button>
        </CopyToClipboard>
      )}
    </div>
  );
};

export default MessageActions;