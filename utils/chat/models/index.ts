// src/utils/chat/models/index.ts
import { Message } from '@/types/chat';
// import { generateResponse as generateGPT35 } from './gpt35';
import { generateResponse as generateGPT4MINI } from './gpt4-mini';
import { generateResponse as generateGEMINI } from './gemini';

type ModelHandler = (messages: Message[]) => Promise<Message>;

const modelHandlers: Record<string, ModelHandler> = {
  // 'gpt-3.5': generateGPT35,
  'gpt-4o-mini': generateGPT4MINI,
  'gemini': generateGEMINI,
};

export function getModelHandler(model: string): ModelHandler | null {
  return modelHandlers[model] || null;
}