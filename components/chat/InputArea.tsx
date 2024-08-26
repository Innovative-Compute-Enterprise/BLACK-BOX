import React, { useRef, useEffect, useState } from 'react';
import ModelSelector from './ModelSelector';

const InputArea = ({ input, setInput, handleSendMessage, isSubmitting, model, setModel }) => {
  const textareaRef = useRef(null);
  const [isMultiline, setIsMultiline] = useState(false);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setIsMultiline(e.target.value.includes('\n'));
    adjustTextareaHeight();
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        setIsMultiline(true);
      } else {
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end space-x-2 dark:bg-[#0E0E0E]/70 bg-[#F1F1F1]/70 dark:border-[#ffffff]/10 border-black/10 border rounded-lg backdrop-blur-lg p-2 mb-6">
          <ModelSelector model={model} setModel={setModel} />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={isMultiline ? undefined : 1}
            className={`flex-grow bg-transparent dark:text-white text-black dark:placeholder-gray-400 placeholder-gray-800 border-none focus:outline-none focus:ring-0 resize-none ${isMultiline ? 'min-h-[40px] max-h-[420px]' : 'h-[40px]'} py-2 px-3`}
          />
          <button
            onClick={handleSendMessage}
            disabled={isSubmitting || !input.trim()}
            className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;