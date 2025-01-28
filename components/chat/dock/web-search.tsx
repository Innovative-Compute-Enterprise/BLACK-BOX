"use client";

import React, { useState, useContext } from "react";
import { ChatContext } from "@/context/ChatContext"; 

type ButtonState = "default" | "enabled" | "disabled";

function WebSearchButton() {
  const { model } = useContext(ChatContext);
  const [buttonState, setButtonState] = useState<ButtonState>("default");

  const isModelValid = model.toLowerCase() === "gemini"; 

  const handleClick = () => {
    if (isModelValid) {
      if (buttonState === "default") {
        setButtonState("enabled");
        console.log("Web search initiated...");
      } else if (buttonState === "enabled") {
        setButtonState("default");
        console.log("Web search stopped");
      }
    }
  };

  const buttonClassName = `flex-shrink-0 p-1 rounded-full ml-2 transition-colors items-center ${
    buttonState === "enabled"
      ? "bg-blue-500 text-white"
      : "text-black dark:text-white dark:hover:bg-zinc-900 hover:bg-zinc-100"
  } ${!isModelValid ? "cursor-not-allowed" : ""}`;

  return (
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
          className="size-6"
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
        {buttonState === "enabled" && (
          <div className="ml-1.5 text-sm pr-1">Find</div> 
        )}
      </div>
    </button>
  );
}

export default WebSearchButton;