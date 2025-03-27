// MessageRow.tsx
"use client";

import React from "react";
import MessageBubble from "./messageBubble";
import MessageActions from "./messageActions";
import { Message } from "@/src/types/chat";

interface MessageRowProps {
  message: Message;
  copiedId?: string | null;
  handleCopy: (id: string) => void;
  index: number;
  isLast: boolean;
}

const MessageRow: React.FC<MessageRowProps> = React.memo(
  ({ message, copiedId, handleCopy, isLast, index }) => {
    const isUser = message.role === "user";
    const rowClassName = isUser 
      ? "justify-end" 
      : "justify-start";
    
    return (
      <div 
        className={`my-9 ${rowClassName}`}
        role="listitem"
        aria-label={`Message ${index + 1}${isLast ? ", most recent" : ""}`}
        id={`message-${message.id}`}
      >
        <div
          className={`inline-block w-full max-w-2xl ${
            isUser ? "flex justify-end" : "justify-start"
          }`}
        >
          <div className="group relative">
            <MessageBubble message={message} />

            {!isUser && message.content.length > 0 && (
              <MessageActions
                message={message}
                copiedId={copiedId}
                handleCopy={handleCopy}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);

MessageRow.displayName = "MessageRow";

export default React.memo(MessageRow);