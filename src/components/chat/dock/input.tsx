"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

interface TextInputProps {
  input: string;
  className?: string;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  rows: number;
}

function TextInput({ input, setInput, handleSendMessage, className = "", rows }: TextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMultiline, setIsMultiline] = useState(false);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 400);
      textarea.style.height = `${newHeight}px`;
      setIsMultiline(textarea.scrollHeight > textarea.clientHeight || input.includes("\n"));
    }
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setTimeout(adjustTextareaHeight, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSendMessage();
      }
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  const baseClassName = `
    w-full
    dark:text-white 
    bg-white 
    dark:bg-black
    text-black 
    border-0
    focus:outline-none 
    focus:ring-0 
    resize-none
    text-lg
    font-normal
    h-full
    text-base 
    overflow-y-auto
    whitespace-pre-wrap
    leading-normal
  `;

  return (
    <textarea
      ref={textareaRef}
      value={input}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      rows={rows}
      placeholder="Pergunte qualquer coisa"
      className={`${baseClassName} ${className}`}
      aria-label="Message input"
    />
  );
}

export default TextInput;