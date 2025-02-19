"use client";
import React, { useContext, useState } from "react";
import { ChatContext } from "@/context/ChatContext";
import ModelSelector from "@/components/chat/ModelSelector";
import TextInput from "../chat/dock/input";
import SendButton from "../chat/dock/submit";
import FileUploadButton from "../chat/dock/upload-button";
import SelectedFilesDisplay from "../chat/dock/uploaded-files";
import WebSearchButton from "./dock/web-search";
import { cortex } from '@/lib/ai/cortex';

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

const ButtonWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="shrink-0 flex items-center">{children}</div>
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
  model,
  setModel,
  isModelLocked,
}: InputAreaProps) {
  const { model: contextModel } = useContext(ChatContext);
  const cortexLib = cortex();
  // Use cortex's canHandleFiles instead of the hardcoded list
  const [isWebSearchActive, setIsWebSearchActive] = useState<boolean>(false);

  const showFileButton = cortexLib.canHandleFiles(contextModel);

  const renderEmptyState = () => (
    <div className="w-full h-full flex flex-col justify-center items-center absolute top-0 left-0">
      <div className="max-w-2xl mx-auto px-3 w-full">
        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <SelectedFilesDisplay files={selectedFiles} onRemoveFile={onRemoveFile} />
          </div>
        )}

        <div
          className="
          flex flex-col
          dark:border-[#ffffff]/20 
          border-black/20 
          border 
          rounded-3xl 
          bg-white 
          dark:bg-black
          px-2
          pt-1
          pb-2
          dark:shadow-[0_0_20px_rgba(255,255,255,0.11),0_0_5px_rgba(255,255,255,0.08)]
          shadow-[0_0_20px_rgba(0,0,0,0.10),0_0_5px_rgba(0,0,0,0.05)]
        "
        >
          <div className="flex items-start">
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
            <ButtonWrapper>
              {showFileButton && <FileUploadButton onFilesSelected={onFilesSelected} />}
              <WebSearchButton toggleWebSearch={(active) => setIsWebSearchActive(active)} />
              <ModelSelector
                model={model}
                setModel={setModel}
                isModelLocked={isModelLocked}
              />
            </ButtonWrapper>

            <ButtonWrapper>
              <SendButton
                onClick={handleSendMessage}
                disabled={isSubmitting || (!input.trim() && selectedFiles.length === 0)}
              />
            </ButtonWrapper>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRegularLayout = () => (
    <div className="w-full dark:bg-black bg-white sticky bottom-0">
      <div className="max-w-3xl mx-auto px-3 pb-1.5 w-full relative">
        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <SelectedFilesDisplay files={selectedFiles} onRemoveFile={onRemoveFile} />
          </div>
        )}

        <div
          className="
            flex 
            flex-col
            dark:border-[#ffffff]/20
            border-black/20 
            border 
            bg-white 
            dark:bg-black
            p-1 
            pb-2
            rounded-3xl
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
          <div className="flex items-center justify-between w-full px-2 py-1">
            <ButtonWrapper>
              {showFileButton && <FileUploadButton onFilesSelected={onFilesSelected} />}
              <WebSearchButton toggleWebSearch={(active) => setIsWebSearchActive(active)} />
              <ModelSelector
                model={model}
                setModel={setModel}
                isModelLocked={isModelLocked}
              />
            </ButtonWrapper>
            <ButtonWrapper>
              <SendButton
                onClick={handleSendMessage}
                disabled={isSubmitting || (!input.trim() && selectedFiles.length === 0)}
              />
            </ButtonWrapper>
          </div>
        </div>
      </div>
      <p className="text-xs opacity-30 w-full text-center pb-1.5">
        Gerado por IA, apenas para referência
      </p>
    </div>
  );

  return hasMessages ? renderRegularLayout() : renderEmptyState();
}

export default React.memo(ChatDock);
