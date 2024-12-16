import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Clipboard } from 'lucide-react';
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
        .filter(isTextContent) // Filtra apenas os conteúdos de texto using a type guard
        .map(content => content.text) // Now it's safe to access content.text
        .join(' '); // Junta todos os textos em uma única string
};


const MessageActions: React.FC<MessageActionsProps> = ({ message, copiedId, handleCopy }) => {
  const messageText = getMessageText(message); // Obtenha o texto completo da mensagem

  return (
    <div className="space-x-2 pt-2">
      {message.role === 'assistant' && ( // Check if the message is from the assistant
        <CopyToClipboard text={messageText} onCopy={() => handleCopy(message.id)}>
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
      )}
    </div>
  );
};

export default MessageActions;