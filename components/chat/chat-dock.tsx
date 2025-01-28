// ChatDock.tsx
"use client";
import React, { useContext } from "react";
import { ChatContext } from "@/context/ChatContext";
import TextInput from "../chat/dock/input";
import SendButton from "../chat/dock/submit";
import FileUploadButton from "../chat/dock/upload-button";
import SelectedFilesDisplay from "../chat/dock/uploaded-files";
import BlackBox from "../icons/BlackBox";
import WebSearchButton from "./dock/web-search";
import ModelSelector from "./ModelSelector";

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  isSubmitting: boolean;
  onFilesSelected: (files: FileList) => void;
  selectedFiles: File[];
  hasMessages: boolean;
  onRemoveFile: (index: number) => void;
  model: string;
  setModel: (model: string) => void;
  isModelLocked: boolean;
}

// Move canHandleFiles outside the component for performance
const modelsThatSupportFiles = ["gpt-4o-mini", "gemini"];
function canHandleFiles(modelName: string): boolean {
  return modelsThatSupportFiles.includes(modelName.toLowerCase());
}

// Extract a reusable wrapper for button groups
const ButtonWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="shrink-0 flex items-center">{children}</div>;

function ChatDock({
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
  isModelLocked 
}: InputAreaProps) {
  const { model: contextModel } = useContext(ChatContext);
  const showFileButton = canHandleFiles(contextModel);

  const renderEmptyState = () => (
    <div className="w-full h-screen flex flex-col justify-center">
      <div className="max-w-2xl mx-auto px-3 w-full -translate-y-16">
        {/* Empty State Message */}
        <div className="flex justify-center items-center mb-6">
          <BlackBox className="size-12" />
        </div>

        {/* Conditional File Display for Mobile */}
        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <SelectedFilesDisplay
              files={selectedFiles}
              onRemoveFile={onRemoveFile}
            />
          </div>
        )}

        <div
          className="
          flex flex-col
          dark:border-[#ffffff]/20 
          border-black/20 
          border 
          rounded-3xl 
          px-2
          pt-1
          pb-2
          /* Multi-layered glow effect */
          dark:shadow-[0_0_20px_rgba(255,255,255,0.11),0_0_5px_rgba(255,255,255,0.08)]
          shadow-[0_0_20px_rgba(0,0,0,0.10),0_0_5px_rgba(0,0,0,0.05)]
        "
        >
          <div className="flex items-start">
            {/* Text Input */}
            <div className="flex-1 min-w-0">
              <TextInput
                input={input}
                setInput={setInput}
                rows={2}
                className="py-2 px-3 rounded-t-xl"
                handleSendMessage={handleSendMessage}
              />
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
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
      <div className="max-w-3xl mx-auto px-3 pb-1.5 w-full relative">
        {/* Selected Files Display */}
        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <SelectedFilesDisplay
              files={selectedFiles}
              onRemoveFile={onRemoveFile}
            />
          </div>
        )}

        <div
          className="
            flex 
            flex-col
          dark:border-[#ffffff]/20
          border-black/20 
            border 
            p-1 
            pb-1
            rounded-3xl
            /* Multi-layered glow effect */
            dark:shadow-[0_0_20px_rgba(255,255,255,0.11),0_0_5px_rgba(255,255,255,0.08)]
            shadow-[0_0_20px_rgba(0,0,0,0.10),0_0_5px_rgba(0,0,0,0.05)]
            "
        >
          <div className="flex items-start">
            <div className="flex-1 min-w-0">
              <TextInput
                rows={1}
                input={input}
                setInput={setInput}
                className="min-h-[44px] py-2 px-3 rounded-b-none rounded-t-xl"
                handleSendMessage={handleSendMessage}
              />
            </div>
          </div>
          <div className="flex items-center justify-between w-full px-2 pb-2">
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
      <p className="text-xs opacity-30 w-full text-center pb-1.5">AI-generated, for reference only</p>
    </div>
  );

  return hasMessages ? renderRegularLayout() : renderEmptyState();
}

export default React.memo(ChatDock);
