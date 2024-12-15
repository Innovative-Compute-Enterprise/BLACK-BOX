import React, { useEffect, useRef } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/shadcn/command";

export interface ChatHistory {
  id: string;
  title?: string;
  created_at: string;
}

interface ChatSearchProps {
  chatHistories: ChatHistory[];
  onChatSelection: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatSearch({
  chatHistories,
  onChatSelection,
  isOpen,
  onClose,
}: ChatSearchProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSelect = (id: string) => {
    onChatSelection(id);
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);
    } else {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleClickOutside);
    };
}, [isOpen, handleKeyDown, handleClickOutside]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-opacity-30 z-10 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="p-4 w-full max-w-lg dark:bg-[#0E0E0E] bg-[#F1F1F1] rounded-[20px] border dark:border-white/20 border-black/20"
      >
        <Command className="shadow-sm">
          <CommandInput placeholder="Search chats..." />
          <CommandList className="scrollbar-hide">
            <CommandEmpty>No chats found.</CommandEmpty>
            <CommandGroup heading="Chats">
              {chatHistories.map((chat) => (
                <CommandItem
                  key={chat.id}
                  onSelect={() => handleSelect(chat.id)}
                  className=" py-3"
                >
                  {chat.title || `Chat ${chat.id}`}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
}