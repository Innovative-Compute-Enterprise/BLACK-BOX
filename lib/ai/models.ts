// src/lib/models.ts
import { AIModelConfig, ModelHandler } from './cortex';
import { generateResponse as generateGPT4MINI } from '@/src/app/api/ai/chatGPT/route';
import { generateResponse as generateGEMINI } from '@/src/app/api/ai/gemini/route'; 
import { generateResponse as generateSONNET3 } from '@/src/app/api/ai/claude/route'; 
import { getSystemPrompt } from './prompts'; 

export const modelsConfig: AIModelConfig[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o',
    description: 'Excepcional para tarefas diarias.',
    acceptsFiles: true,
    handler: generateGPT4MINI as ModelHandler, 
    systemPrompt: getSystemPrompt,
  },
  {
    id: 'gemini',
    name: 'Gemini 2.0',
    description: 'Feito para tarefas gigantes.',
    acceptsFiles: true,

    handler: generateGEMINI as ModelHandler, 
    systemPrompt: getSystemPrompt,
  },
  {
    id: 'claude-sonnet-3.5',
    name: 'Sonnet-3.5',
    description: 'Exelente para tarefas dificeis',
    acceptsFiles: false,

    handler: generateSONNET3 as ModelHandler, 
    systemPrompt: getSystemPrompt,
  },
];
