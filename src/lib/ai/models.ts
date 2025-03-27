// src/lib/models.ts
import { AIModelConfig, ModelHandler } from './cortex';
import { generateResponse as generateGPT4MINI } from '@/src/lib/ai/response/chatGPT/generateResponse';
import { generateResponse as generateGEMINI } from '@/src/lib/ai/response/gemini/generateResponse'; 
import { generateResponse as generateGEMINI_THINK } from '@/src/lib/ai/response/gemini/generateResponseThink'; 
import { generateResponse as generateSONNET3 } from '@/src/lib/ai/response/claude/generateResponse'; 
import { getSystemPrompt } from './prompts'; 

export const modelsConfig: AIModelConfig[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Feito para tarefas gigantes, com enfase em rapidez e volume.',
    acceptsFiles: true,
    handler: generateGEMINI_THINK as ModelHandler,
    systemPrompt: getSystemPrompt,
  },
  {
    id: 'gemini',
    name: 'Gemini 2.5 Pro',
    description: 'Excepcional com para tarefas complexas e de grande volume de dados',
    acceptsFiles: true,
    handler: generateGEMINI as ModelHandler, 
    systemPrompt: getSystemPrompt,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o',
    description: 'Excepcional para tarefas diarias.',
    acceptsFiles: true,
    handler: generateGPT4MINI as ModelHandler, 
    systemPrompt: getSystemPrompt,
  },
  {
    id: 'claude-sonnet-3.5',
    name: 'Sonnet-3.7',
    description: 'Especializado para tarefas super dificeis, como programacao, matematica.',
    acceptsFiles: true,
    handler: generateSONNET3 as ModelHandler, 
    systemPrompt: getSystemPrompt,
  },
];
