"use client";

import React, { useState, useEffect } from "react";
import {
  Listbox,
  ListboxOption,
  ListboxButton,
  ListboxOptions,
} from "@headlessui/react";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { cortex } from "@/src/lib/ai/cortex";
import { chatSettings } from "@/src/utils/chat/settings";
import clsx from "clsx";
import { createClient } from "@/src/utils/supabase/client";

interface ModelSelectorProps {
  model: string;
  setModel: (model: string) => void;
  isModelLocked: boolean;
  toggleModelLock?: (locked: boolean) => void;
  userId?: string; // Add userId prop to fetch available models
}

// Will be replaced with filtered models from chatSettings
const defaultModels = cortex().models();

const ModelSelector: React.FC<ModelSelectorProps> = ({
  model,
  setModel,
  isModelLocked,
  userId,
}) => {
  const isMobile = useIsMobile();
  const [availableModels, setAvailableModels] = useState(defaultModels);
  const [selectedModel, setSelectedModel] = useState(model);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedModel(model);
  }, [model]);

  // Load available models for the user based on their subscription tier
  useEffect(() => {
    async function loadAvailableModels() {
      if (!userId) {
        // If no userId provided, fall back to default models
        return;
      }

      setLoading(true);
      try {
        // Get all model details the user has access to
        const userModels = await chatSettings.getAvailableModelDetails(userId);
        
        if (userModels && userModels.length > 0) {
          setAvailableModels(userModels);
          
          // If current model is not available for this user, switch to first available
          const isCurrentModelAvailable = userModels.some(m => m.id === selectedModel);
          if (!isCurrentModelAvailable && userModels.length > 0) {
            setModel(userModels[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading available models:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAvailableModels();
  }, [userId, setModel, selectedModel]);

  const handleModelChange = (selectedModelId: string) => {
    if (!isModelLocked) {
      setSelectedModel(selectedModelId);
      setModel(selectedModelId);
    }
  };

  const selectedModelInfo = availableModels.find((m) => m.id === selectedModel) || availableModels[0];

  return (
    <div className="relative inline-block text-center w-full max-w-fit ml-2.5">
      {loading ? (
        <div className="px-4 py-2 text-sm opacity-75">Loading models...</div>
      ) : (
        <Listbox
          value={selectedModel}
          onChange={handleModelChange}
          disabled={isModelLocked}
          as="div"
          className="relative"
        >
          {({ open }) => (
            <>
              <div className="flex items-center">
                <ListboxButton
                  className={clsx(
                    "relative w-full rounded-full py-1.5 px-2",
                    "text-black dark:text-white dark:border-[#ffffff]/20 border-black/20 border focus:outline-none focus:ring-1",
                    isModelLocked
                      ? "bg-gray-100 dark:bg-zinc-900 cursor-not-allowed opacity-75"
                      : "cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800",
                    "flex justify-between items-center"
                  )}
                >
                  <span className="block font-medium text-sm opacity-90">
                    {selectedModelInfo?.name || "Select model"}
                  </span>
                </ListboxButton>
              </div>
              <ListboxOptions
                className={clsx(
                  "absolute z-50 /* Ensure high z-index */ bottom-full /* Position above the button */ mb-2 /* Add margin to separate from button */ space-y-2 focus:outline-none w-[300px] rounded-xl text-left p-3 dark:bg-[#0E0E0E]/70 bg-[#F1F1F1]/70 dark:border-[#ffffff]/10 border-black/10 border backdrop-blur-lg",
                  "max-h-120 overflow-auto focus:outline-none",
                  isMobile ? "left-1/2 -translate-x-1/2" : "left-0"
                )}
              >
                <div>
                  <div className="text-xs pl-2.5 mt-1 mb-3 font-semibold text-gray-500 dark:text-gray-400">
                    Models available with your subscription
                  </div>
                </div>
                {availableModels.map((modelOption) => (
                  <ListboxOption
                    key={modelOption.id}
                    value={modelOption.id}
                    className={({ focus }) =>
                      clsx(
                        "select-none relative py-3 pl-3 pr-3 rounded-lg hover:dark:bg-[#2B2B2B] hover:bg-[#D4D4D4] cursor-pointer",
                        focus ? "" : "text-black dark:text-white"
                      )
                    }
                  >
                    {({ selected, focus }) => (
                      <div className="">
                        <span
                          className={clsx(
                            "block truncate text-sm font-bold",
                            selected ? "underline" : ""
                          )}
                        >
                          {modelOption.name}
                        </span>
                        <span
                          className={clsx(
                            "block text-xs text-gray-500 dark:text-gray-400 mt-1",
                            focus ? "" : ""
                          )}
                        >
                          {modelOption.description}
                        </span>
                      </div>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </>
          )}
        </Listbox>
      )}
    </div>
  );
};

export default ModelSelector;
