import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Clipboard } from 'lucide-react';
import { Message } from '@/types/chat';

interface MessageActionsProps {
  message: Message;
  copiedId: string | null;
  handleCopy: (id: string) => void;
}

// Função para extrair o texto de uma mensagem
const getMessageText = (message: Message) => {
  return message.content
    .filter(content => content.type === 'text') // Filtra apenas os conteúdos de texto
    .map(content => content.text) // Extrai o texto de cada conteúdo
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
