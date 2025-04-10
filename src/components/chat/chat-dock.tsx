"use client";

import React, { useContext, useMemo, useEffect, useRef, useCallback } from "react";
import { ChatContext } from "@/src/context/ChatContext";
import ModelSelector from "@/src/components/chat/ModelSelector";
import TextInput from "./dock/input";
import SendButton from "./dock/submit";
import FileUploadButton from "./dock/upload-button";
import SelectedFilesDisplay from "./dock/uploaded-files";
import WebSearchButton from "./dock/web-search";
import { cortex } from "@/src/lib/ai/cortex";
import { motion, AnimatePresence } from 'motion/react';
import {MonaSans} from "@/src/styles/fonts/font";
import dynamic from 'next/dynamic';

const NoSSR = dynamic<{ children: React.ReactNode }>(
  () => Promise.resolve(({ children }) => <>{children}</>), 
  { ssr: false }
);

interface ProcessedFile {
  originalFile: File;
  processedFile?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    mime_type: string;
    isImage: boolean;
  };
  isProcessing: boolean;
  error?: string;
}

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  isSubmitting: boolean;
  showFileButton: boolean;
  onFilesSelected: (files: FileList) => void;
  selectedFiles: ProcessedFile[];
  toggleWebSearch: (active: boolean) => void;
  model: string;
  setModel: (model: string) => void;
  isModelLocked: boolean;
  toggleModelLock?: (locked: boolean) => void;
  isFileUploadDisabled?: boolean;
}

interface FilesDisplayProps {
  files: ProcessedFile[];
  onRemoveFile: (index: number) => void;
  isFileUploadDisabled?: boolean;
}

interface ChatDockProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  isSubmitting: boolean;
  onFilesSelected: (files: FileList) => void;
  selectedFiles: ProcessedFile[]; 
  hasMessages: boolean;
  onRemoveFile: (index: number) => void;
  model: string;
  setModel: (model: string) => void;
  isModelLocked: boolean;
  userName: string;
  toggleWebSearch: (active: boolean) => void;
  toggleModelLock?: (locked: boolean) => void;
  isNewChatTransition?: boolean;
  isFileUploadDisabled?: boolean;
}

const ButtonWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="shrink-0 flex items-center relative z-10">{children}</div>;

// Move InputArea outside component to prevent recreation on each render
const InputArea = React.memo(({
  input,
  setInput,
  handleSendMessage,
  isSubmitting,
  showFileButton,
  onFilesSelected,
  selectedFiles,
  toggleWebSearch,
  model,
  setModel,
  isModelLocked,
  toggleModelLock,
  isFileUploadDisabled,
}: InputAreaProps) => (
  <div className="flex flex-col dark:border-[#ffffff]/20 border-black/10 border bg-white dark:bg-black p-3 rounded-3xl shadow-[0_0_12px_rgba(0,0,0,0.10)] dark:shadow-[0_0_12px_rgba(255,255,255,0.11)]">
    <div className="flex items-start">
      <div className="flex-1 min-w-0 px-2.5 py-1.5">
        <TextInput input={input} setInput={setInput} handleSendMessage={handleSendMessage} rows={2} />
      </div>
    </div>
    <div className="flex items-center justify-between w-full">
      <ButtonWrapper>
        {showFileButton && <FileUploadButton onFilesSelected={onFilesSelected} disabled={isFileUploadDisabled} />}
        <WebSearchButton toggleWebSearch={toggleWebSearch} />
        <ModelSelector model={model} setModel={setModel} isModelLocked={isModelLocked} toggleModelLock={toggleModelLock} />
      </ButtonWrapper>
      <ButtonWrapper>
        <SendButton 
          onClick={handleSendMessage} 
          disabled={isSubmitting || (!input.trim() && (
            selectedFiles.length === 0 || 
            selectedFiles.every(file => file.isProcessing || file.error)
          ))} 
        />
      </ButtonWrapper>
    </div>
  </div>
));

// Add displayName to fix lint error
InputArea.displayName = 'InputArea';

// Move FilesDisplay outside component to prevent recreation on each render
const FilesDisplay = React.memo(({ files, onRemoveFile }: FilesDisplayProps) => 
  files && files.length > 0 ? (
    <div className="mb-4 relative">
      <SelectedFilesDisplay files={files} onRemoveFile={onRemoveFile} />
    </div>
  ) : null
);

// Add displayName to fix lint error
FilesDisplay.displayName = 'FilesDisplay';

// Main component with performance optimizations
function ChatDock(props: ChatDockProps) {
  const {
    input,
    setInput,
    handleSendMessage,
    isSubmitting,
    onFilesSelected,
    selectedFiles,
    hasMessages,
    onRemoveFile,
    model,
    setModel,
    isModelLocked,
    userName,
    toggleWebSearch,
    toggleModelLock,
    isNewChatTransition = false,
    isFileUploadDisabled,
  } = props;

  const { model: contextModel } = useContext(ChatContext);
  const previousHasMessages = useRef(hasMessages);
  const isInitialRender = useRef(true);
  
  useEffect(() => {
    if (!isInitialRender.current) {
      if (previousHasMessages.current && !hasMessages) {
        let newTransition = true;
        if (typeof isNewChatTransition !== 'undefined') {
          newTransition = true;
        }
      }
    }
    previousHasMessages.current = hasMessages;
    isInitialRender.current = false;
  }, [hasMessages, isNewChatTransition]);
  
  const showFileButton = cortex().canHandleFiles(contextModel);

  const memoizedInputAreaProps = useMemo(() => ({
    input,
    setInput,
    handleSendMessage,
    isSubmitting,
    showFileButton,
    onFilesSelected,
    selectedFiles,
    toggleWebSearch,
    model,
    setModel,
    isModelLocked,
    toggleModelLock,
    isFileUploadDisabled,
  }), [
    input,
    setInput,
    handleSendMessage,
    isSubmitting,
    showFileButton,
    onFilesSelected,
    selectedFiles,
    toggleWebSearch,
    model,
    setModel,
    isModelLocked,
    toggleModelLock,
    isFileUploadDisabled,
  ]);

  const renderEmptyStateContent = useMemo(() => (
    <motion.div 
      key="empty-state"
      className="w-full h-full flex flex-col justify-center items-center absolute"
    >
      <NoSSR>
        <>
          <motion.div 
            initial={isNewChatTransition ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
              <p style={{ fontStretch: '125%' }} className={`${MonaSans.className} text-3xl font-[900] uppercase text-center mb-16 text-zinc-700 dark:text-zinc-300`}>
              Como posso ajudar?
            </p>
          </motion.div>

          <motion.div 
            initial={isNewChatTransition ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7, ease: 'easeOut', delay: isNewChatTransition ? 0 : 0.3 }}
            className="max-w-3xl mx-auto px-4 w-full"
          >
            <FilesDisplay files={selectedFiles} onRemoveFile={onRemoveFile} />
            <InputArea {...memoizedInputAreaProps} />
          </motion.div>
        </>
      </NoSSR>
    </motion.div>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [userName, isNewChatTransition, selectedFiles, onRemoveFile, memoizedInputAreaProps]);

  const renderRegularContent = useMemo(() => (
    <motion.div 
      key="regular-layout"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="sticky bottom-0 overflow-visible dark:bg-black bg-white z-0"
    >
      <div className="max-w-3xl mx-auto pb-1 w-full relative">
        <FilesDisplay files={selectedFiles} onRemoveFile={onRemoveFile} />
        <InputArea {...memoizedInputAreaProps} />
      </div>
      <p className="text-xs text-center text-zinc-400 dark:text-zinc-500 pb-1">
       Gerado por IA , sempre verifique a informação.
      </p>
    </motion.div>
  ), [selectedFiles, onRemoveFile, memoizedInputAreaProps]);

  return (
    <AnimatePresence mode="wait">
      {hasMessages ? renderRegularContent : renderEmptyStateContent}
    </AnimatePresence>
  );
}

export default React.memo(ChatDock);
