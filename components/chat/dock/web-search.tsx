"use client";

import React, { useState, useContext } from "react";
import { ChatContext } from "@/context/ChatContext";
import { Tooltip } from "@heroui/tooltip";

type ButtonState = "default" | "enabled" | "disabled";

interface WebSearchButtonProps {
  toggleWebSearch: (active: boolean) => void;
}

function WebSearchButton({ toggleWebSearch }: WebSearchButtonProps) {
  const { model } = useContext(ChatContext);
  const [buttonState, setButtonState] = useState<ButtonState>("default");

  const isModelValid = model?.toLowerCase() === "gemini";

  const handleClick = () => {
    if (!isModelValid) return;
    if (buttonState === "default") {
      setButtonState("enabled");
      toggleWebSearch(true);
      console.log("Web search activated (hidden trigger set).");
    } else if (buttonState === "enabled") {
      setButtonState("default");
      toggleWebSearch(false);
      console.log("Web search deactivated.");
    }
  };

  const buttonClassName = `flex-shrink-0 rounded-full px-2 py-1.5 ml-2.5 
    transition-colors items-center text-black/80 dark:text-white/80 
    dark:bg-[#0E0E0E] bg-[#F1F1F1] dark:border-[#ffffff]/20 border-black/20 border 
    focus:outline-none focus:ring-1 ${
      buttonState === "enabled"
        ? "bg-blue-500 text-white dark:bg-blue-500 dark:text-white"
        : "text-black dark:text-white dark:hover:bg-zinc-900 hover:bg-zinc-100"
    } ${!isModelValid ? "cursor-not-allowed" : ""}`;

  return (
    <Tooltip
      content="Activate Web Search"
      showArrow={true}
      closeDelay={100}
      className="bg-[#2B2B2B] rounded-lg text-white text-sm"
    >
      <button
        aria-label="Web Search"
        className={buttonClassName}
        onClick={handleClick}
        disabled={!isModelValid || buttonState === "disabled"}
      >
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="size-4"
          >
            <g
              fill="none"
              stroke={buttonState === "enabled" ? "white" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3.6 9h16.8" />
              <path d="M3.6 15h16.8" />
              <path d="M11.5 3a17 17 0 0 0 0 18" />
              <path d="M12.5 3a17 17 0 0 1 0 18" />
            </g>
          </svg>
          <div className="ml-1.5 text-sm font-medium">Buscar</div>
        </div>
      </button>
    </Tooltip>
  );
}

export default WebSearchButton;
