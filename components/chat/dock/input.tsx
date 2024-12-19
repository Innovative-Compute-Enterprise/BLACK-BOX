'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface TextInputProps {
    input: string;
    setInput: (value: string) => void;
    handleSendMessage: () => void;
}

function TextInput({ input, setInput, handleSendMessage }: TextInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isMultiline, setIsMultiline] = useState(false);


    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            // Reset height before recalculating
            textarea.style.height = 'auto';

            // Calculate new height while respecting max height (180px)
            const newHeight = Math.min(textarea.scrollHeight, 300);
            textarea.style.height = `${newHeight}px`;

            // Update multiline state if content exceeds one line or contains '\n'
            setIsMultiline(
                textarea.scrollHeight > textarea.clientHeight || input.includes('\n')
            );
        }
    }, [textareaRef, input]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        // Defer height adjustment until after the value updates
        setTimeout(adjustTextareaHeight, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Let newline occur, then adjust height
                setTimeout(adjustTextareaHeight, 0);
            } else {
                e.preventDefault();
                if (input.trim()) {
                    handleSendMessage();
                }
            }
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [input, adjustTextareaHeight]);

    return (
        <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Em que posso ajudar?"
            rows={1}
            className={`
        w-full
        rounded-lg
        placeholder:opacity-50
        dark:text-white 
        bg-transparent
        text-black 
        border-none 
        focus:outline-none 
        min-h-[44px]
        focus:ring-0 
        resize-none
        text-base
        py-3
        px-2
        overflow-y-auto
        ${isMultiline ? '' : ''}
      `}
            aria-label="Message input"
        />
    );
}

export default TextInput;