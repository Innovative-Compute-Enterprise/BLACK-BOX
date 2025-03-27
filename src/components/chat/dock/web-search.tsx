"use client";

import React, { useState, useContext, useEffect, useMemo } from "react";
import { ChatContext } from "@/src/context/ChatContext";
import { Tooltip } from "@heroui/tooltip";
import { modelsConfig } from "@/lib/ai/models";

type ButtonState = "default" | "enabled" | "disabled";

interface WebSearchButtonProps {
  toggleWebSearch: (active: boolean) => void;
}

function WebSearchButton({ toggleWebSearch }: WebSearchButtonProps) {
  const { model } = useContext(ChatContext);
  const [buttonState, setButtonState] = useState<ButtonState>("default");
  const [enabledState, setEnabledState] = useState<boolean>(false);

  // Define models that support web search - wrap in useMemo to avoid recreating on every render
  const webSearchSupportedModels = useMemo(() => ["gemini", "gemini-flash", "claude-sonnet-3.5"], []);
  
  // Check if current model supports web search
  const isModelValid = model && webSearchSupportedModels.includes(model.toLowerCase());
  
  useEffect(() => {
    console.log("[WebSearchButton] Current model:", model);
    console.log("[WebSearchButton] Is model valid for web search:", isModelValid);
    
    // If the model changes and is no longer valid, disable web search
    if (!isModelValid && buttonState === "enabled") {
      setButtonState("default");
      setEnabledState(false);
      toggleWebSearch(false);
      console.log("[WebSearchButton] Automatically disabled web search due to model change");
    }
  }, [model, isModelValid, buttonState, toggleWebSearch]);

  // Debug logging when the component mounts
  useEffect(() => {
    console.log("[WebSearchButton] Component mounted");
    console.log("[WebSearchButton] Supported models:", webSearchSupportedModels);
    return () => {
      console.log("[WebSearchButton] Component unmounted");
    };
  }, [webSearchSupportedModels]);

  const handleClick = () => {
    console.log("[WebSearchButton] Button clicked!");
    if (!isModelValid) {
      console.log("[WebSearchButton] Model doesn't support web search:", model);
      return;
    }
    
    if (buttonState === "default") {
      setButtonState("enabled");
      setEnabledState(true);
      toggleWebSearch(true);
      console.log("[WebSearchButton] Web search activated.");
    } else if (buttonState === "enabled") {
      setButtonState("default");
      setEnabledState(false);
      toggleWebSearch(false);
      console.log("[WebSearchButton] Web search deactivated.");
    }
  };

  const buttonClassName = `flex-shrink-0 rounded-full px-2 py-1.5 ml-2.5 
    transition-colors items-center text-black/80 dark:text-white/80 
     dark:border-[#ffffff]/20 border-black/20 border 
    focus:outline-none focus:ring-1 ${
      buttonState === "enabled"
        ? "bg-blue-500 text-white dark:bg-blue-500 dark:text-white"
        : "text-black dark:text-white dark:hover:bg-zinc-900 hover:bg-zinc-100"
    } ${!isModelValid ? "cursor-not-allowed opacity-50" : ""}`;

  return (
    <Tooltip
      content={isModelValid ? "Activate Web Search" : "Web search not available for this model"}
      showArrow={true}
      closeDelay={100}
      className="bg-[#2B2B2B] rounded-lg text-white text-sm"
    >
      <button
        aria-label="Web Search"
        className={buttonClassName}
        onClick={handleClick}
        disabled={!isModelValid || buttonState === "disabled"}
        data-state={enabledState ? "on" : "off"}
        data-testid="web-search-button"
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
