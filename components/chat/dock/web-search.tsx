"use client";

import React from "react";

function WebSearchButton() {
  return (
    <button
      aria-label="Send message"
      className="flex-shrink-0 text-black dark:text-white dark:hover:bg-zinc-800 hover:bg-zinc-300 p-1 min-w-8 h-8 rounded-2xl ml-2 disabled:opacity-50 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24"><g fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      className="size-[24px]" 
      strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M3.6 9h16.8"></path>
      <path d="M3.6 15h16.8"></path><path d="M11.5 3a17 17 0 0 0 0 18"></path><path d="M12.5 3a17 17 0 0 1 0 18"></path></g></svg>

    </button>
  );
}

export default WebSearchButton;
