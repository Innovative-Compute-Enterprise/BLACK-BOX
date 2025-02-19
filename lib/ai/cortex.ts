// src/lib/ai/cortex.ts
import { modelsConfig } from './models'; 
import { Message } from '@/types/chat';

// Re-export your types if needed
export type AIModelConfig = {
  id: string;
  name: string;
  description: string;
  acceptsFiles: boolean;
  acceptsCustomInstructions?: boolean;
  handler: ModelHandler;
  systemPrompt: (context: { selectedChatModel: string }) => string;
};

export type ModelHandler = (messages: Message[], systemPrompt: string) => Promise<Message>;

export function cortex() {
  const modelConfigMap: Record<string, AIModelConfig> = modelsConfig.reduce((map, model) => {
    map[model.id] = model;
    return map;
  }, {});

  const getModelConfig = (modelId: string): AIModelConfig | undefined => {
    return modelConfigMap[modelId];
  };

  const getModelList = (): AIModelConfig[] => {
    return modelsConfig;
  };

  const getModelHandler = (modelId: string): ModelHandler | null => {
    const config = getModelConfig(modelId);
    return config ? config.handler : null;
  };

  const getSystemPrompt = (context: { selectedChatModel: string }): string => {
    const config = getModelConfig(context.selectedChatModel);
    return config ? config.systemPrompt(context) : '';
  };

  const canHandleFiles = (modelId: string): boolean => {
    const config = getModelConfig(modelId);
    return !!config?.acceptsFiles;
  };

  return {
    models: getModelList,
    getModelConfig,
    getModelHandler,
    getSystemPrompt,
    canHandleFiles,
  };
}