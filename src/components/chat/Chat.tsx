// Chat.tsx
"use client";
import React, { useMemo, useEffect, useRef, useCallback } from "react";
import { useChatContext } from "@/src/context/ChatContext";
import { useChat } from "@/src/hooks/useChat";
import MessageDisplay from "./MessageDisplay";
import ChatDock from "./chat-dock";
import ChatHeader from "./chat-header";
import { SubscriptionWithProduct } from "@/src/types/types";

// Define types
// interface ProcessedFile {
//   originalFile: File;
//   processedFile?: {
//     id: string;
//     name: string;
//     type: string;
//     size: number;
//     url: string;
//     mime_type: string;
//     isImage: boolean;
//   };
//   isProcessing: boolean;
//   error?: string;
// }

// interface FileDiagnosticProps {
//   files: ProcessedFile[];
//   isProcessing: boolean;
// }

// Helper diagnostic component
// const FileDiagnostic = React.memo(({ files, isProcessing }: FileDiagnosticProps) => {
//   if (!files || files.length === 0) {
//     return (
//       <div className="fixed top-20 right-4 bg-gray-800 text-white p-3 rounded-lg z-50 shadow-lg">
//         <div className="text-sm font-semibold">File Diagnostic</div>
//         <div className="text-xs mt-1">No files uploaded</div>
//       </div>
//     );
//   }
  
//   return (
//     <div className="fixed top-20 right-4 bg-gray-800 text-white p-3 rounded-lg z-50 shadow-lg max-w-xs">
//       <div className="text-sm font-semibold">File Diagnostic</div>
//       <div className="text-xs mt-1">Files: {files.length}, Processing: {isProcessing ? "Yes" : "No"}</div>
//       <div className="mt-2 max-h-32 overflow-y-auto">
//         {files.map((file, idx) => (
//           <div key={idx} className="text-xs mb-1 border-t border-gray-700 pt-1">
//             <div className="truncate">{file.originalFile?.name || "Unknown"}</div>
//             <div className="flex gap-2 mt-0.5">
//               <span className={file.isProcessing ? "text-blue-300" : "text-green-300"}>
//                 {file.isProcessing ? "Processing" : "Ready"}
//               </span>
//               {file.error && <span className="text-red-300">Error</span>}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// });

// FileDiagnostic.displayName = 'FileDiagnostic';

interface ChatProps {
  sessionId?: string;
  userName: string;
  // If subscription is needed by ChatHeader, it needs to be passed here
  subscription?: SubscriptionWithProduct | null; // Example
}

export function Chat({ sessionId, userName, subscription }: ChatProps) { // Add subscription if passed
  const { model, setModel, isModelLocked } = useChatContext();
  const isTransitioningRef = useRef(false);
  const previousMessagesLengthRef = useRef(0);
  
  const {
    messages,
    inputMessage,
    isSubmitting,
    selectedFiles,
    userId,
    setInputMessage,
    handleSendMessage,
    handleFilesSelected,
    handleRemoveFile,
    handleNewChat,
    toggleWebSearch,
    toggleModelLock,
    isProcessingFiles,
    chatHistories,         // Added
    loadChatFromHistory,   // Added (for onChatSelection)
    handleDeleteChat,      // Added (for onDeleteChat)
  } = useChat({ sessionId: sessionId });

  // Track when transitions occur from messages -> empty state
  useEffect(() => {
    if (previousMessagesLengthRef.current > 0 && messages.length === 0) {
      isTransitioningRef.current = true;
      
      // Reset the flag after animation completes
      const timeout = setTimeout(() => {
        isTransitioningRef.current = false;
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
    
    previousMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Create wrapper for handleNewChat that marks this as a transition
  const handleNewChatWithTransition = useCallback(() => {
    isTransitioningRef.current = true;
    handleNewChat();
    
    // Reset the transition flag after animation duration
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 1000);
  }, [handleNewChat]);

  // Enhanced file selection handler with error reporting
  const handleFileSelection = useCallback((files: FileList) => {
    console.log(`[Chat] File selection handler called with ${files.length} files`);
    
    try {
      handleFilesSelected(files);
    } catch (error) {
      console.error('[Chat] Error handling file selection:', error);
    }
  }, [handleFilesSelected]);

  // Memoize input value handling to prevent causing re-renders
  const handleSetInputMessage = useCallback((value: string) => {
    setInputMessage(value);
  }, [setInputMessage]);

  // Memoize the value of hasMessages to prevent unnecessary rerenders
  const hasMessages = useMemo(() => 
    messages.length > 0 || isSubmitting, 
    [messages.length, isSubmitting]
  );

  // Memoize the chat dock props to prevent unnecessary re-renders
  const chatDockProps = useMemo(() => ({
    userName,
    input: inputMessage,
    setInput: handleSetInputMessage,
    handleSendMessage,
    isSubmitting,
    onFilesSelected: handleFileSelection,
    selectedFiles: selectedFiles || [],
    onRemoveFile: handleRemoveFile,
    hasMessages,
    model,
    setModel,
    isModelLocked,
    toggleWebSearch,
    toggleModelLock,
    isNewChatTransition: isTransitioningRef.current,
    isFileUploadDisabled: !userId,
  }), [
    userName,
    inputMessage, 
    handleSetInputMessage,
    handleSendMessage, 
    isSubmitting, 
    handleFileSelection,
    selectedFiles, 
    handleRemoveFile, 
    hasMessages, 
    model, 
    setModel, 
    isModelLocked, 
    toggleWebSearch, 
    toggleModelLock,
    userId,
  ]);

  // Use memoized components to prevent unnecessary re-renders
  const headerComponent = useMemo(() => (
    <ChatHeader 
      handleNewChat={handleNewChatWithTransition} 
      toggleModelLock={toggleModelLock} 
      subscription={subscription}
      chatHistories={chatHistories}
      onChatSelection={loadChatFromHistory}
      onDeleteChat={handleDeleteChat}
    />
  ), [
    handleNewChatWithTransition,
    toggleModelLock,
    subscription,
    chatHistories,
    loadChatFromHistory,
    handleDeleteChat,
  ]);

  const messageDisplayComponent = useMemo(() => (
    <MessageDisplay messages={messages} />
  ), [messages]);

  return (
    <div className="flex-1 flex flex-col relative">
      {headerComponent}

      <div className="flex-1 relative" style={{ height: "100vh" }}>
        {messageDisplayComponent}
      </div>

      <ChatDock {...chatDockProps} />

      {/* File Diagnostic Component
      <FileDiagnostic
        files={selectedFiles || []}
        isProcessing={isProcessingFiles}
      /> */}

      {/* Debug indicators */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-2">
        {isProcessingFiles && (
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm shadow-lg">
            Processing files...
          </div>
        )}
        {selectedFiles && selectedFiles.some((file) => file.error) && (
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm shadow-lg">
            Some files have errors
          </div>
        )}
      </div>
    </div>
  );
}
