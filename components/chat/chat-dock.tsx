// ChatDock.tsx
"use client";
import React, { useContext } from "react";
import { ChatContext } from "@/context/ChatContext";
import { useIsMobile } from "@/hooks/use-mobile"
import TextInput from "../chat/dock/input";
import SendButton from "../chat/dock/submit";
import FileUploadButton from "../chat/dock/upload-button";
import SelectedFilesDisplay from "../chat/dock/uploaded-files";
import BlackBox from "../icons/BlackBox";
import WebSearchButton from "./dock/web-search";

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  isSubmitting: boolean;
  onFilesSelected: (files: FileList) => void;
  selectedFiles: File[];
  hasMessages: boolean;
  onRemoveFile: (index: number) => void;
}

// Move canHandleFiles outside the component for performance
const modelsThatSupportFiles = ["gpt-4o-mini", "gemini"];
function canHandleFiles(modelName: string): boolean {
  return modelsThatSupportFiles.includes(modelName.toLowerCase());
}

// Extract a reusable wrapper for button groups
const ButtonWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="shrink-0 flex items-center">
    {children}
  </div>
);

function ChatDock({
  input,
  setInput,
  handleSendMessage,
  isSubmitting,
  onFilesSelected,
  selectedFiles,
  hasMessages,
  onRemoveFile,
}: InputAreaProps) {
  const { model: contextModel } = useContext(ChatContext);
  const isMobile = useIsMobile();
  const showFileButton = canHandleFiles(contextModel);

  const renderEmptyState = () => (
    <div className="w-full h-[calc(100vh-3rem)] flex flex-col justify-center">
      <div className="max-w-3xl mx-auto px-3 w-full -translate-y-16">
        {/* Empty State Message */}
        <div className="flex justify-center items-center mb-6">
          <BlackBox className="size-12" />
        </div>

        {/* Conditional File Display for Mobile */}
        {isMobile && selectedFiles.length > 0 && (
          <div className="mb-4">
            <SelectedFilesDisplay
              files={selectedFiles}
              onRemoveFile={onRemoveFile}
            />
          </div>
        )}
        
        <div className="flex flex-col dark:bg-[#0E0E0E]/60 bg-[#F1F1F1]/60 dark:border-[#ffffff]/10 border-black/10 border rounded-3xl py-1 px-2.5">
          <div className="flex items-start">
            {/* Text Input */}
            <div className="flex-1 min-w-0">
              <TextInput
                input={input}
                setInput={setInput}
                handleSendMessage={handleSendMessage}
              />
            </div>
          </div>
          <div className="flex items-center justify-between w-full h-[44px]">
            {/* File Upload and Web Search Buttons Aligned to the Left */}
            <ButtonWrapper>
              {showFileButton && (
                <FileUploadButton onFilesSelected={onFilesSelected} />
              )}
              <WebSearchButton />
            </ButtonWrapper>
  
            {/* Send Button Positioned Independently */}
            <ButtonWrapper>
              <SendButton
                onClick={handleSendMessage}
                disabled={
                  isSubmitting || (!input.trim() && selectedFiles.length === 0)
                }
              />
            </ButtonWrapper>
          </div>
        </div>
      </div>
    </div>
  );
  

  const renderRegularLayout = () => (
    <div className="w-full">
      <div className="2xl:max-w-3xl max-w-2xl mx-auto px-3 w-full relative">
        {/* Selected Files Display */}
        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <SelectedFilesDisplay
              files={selectedFiles}
              onRemoveFile={onRemoveFile}
            />
          </div>
        )}
  
        <div className="flex flex-col dark:bg-[#0E0E0E]/60 bg-[#F1F1F1]/60 dark:border-[#ffffff]/10 border-black/10 border border-b-0 pt-3 px-3 rounded-t-3xl">
          <div className="flex items-start">
            <div className="flex-1 min-w-0">
              <TextInput
                input={input}
                setInput={setInput}
                handleSendMessage={handleSendMessage}
              />
            </div>
          </div>
          <div className="flex items-center justify-between w-full pb-3 h-[44px]">
            {/* File Upload and Web Search Buttons Aligned to the Left */}
            <ButtonWrapper>
              {showFileButton && (
                <FileUploadButton onFilesSelected={onFilesSelected} />
              )}
              <WebSearchButton />
            </ButtonWrapper>
  
            {/* Send Button Positioned Independently */}
            <ButtonWrapper>
              <SendButton
                onClick={handleSendMessage}
                disabled={
                  isSubmitting || (!input.trim() && selectedFiles.length === 0)
                }
              />
            </ButtonWrapper>
          </div>
        </div>
      </div>
    </div>
  );
  

  return hasMessages ? renderRegularLayout() : renderEmptyState();
}

export default React.memo(ChatDock);