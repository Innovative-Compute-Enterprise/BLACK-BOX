import { Message } from '@/types/chat';
import { OpenAI } from 'openai';
import { generateResponse as generateGPT4MINI } from './gpt4-mini';
import { generateResponse as generateGEMINI } from './gemini';
import { generateResponse as generateSONNET3 } from './claude-sonnet35';

type ModelHandler = (messages: Message[]) => Promise<Message>;

const modelHandlers: Record<string, ModelHandler> = {
  'gpt-4o-mini': generateGPT4MINI,
  'gemini': generateGEMINI,
  'claude-sonnet-3.5': generateSONNET3,
};

export function getModelHandler(model: string): ModelHandler | null {
  return modelHandlers[model] || null;
}

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

export async function generateChatTitle(messages: Message[]): Promise<string> {
  const defaultTitle = 'New Chat';
    if (!messages || messages.length === 0) {
        return defaultTitle;
    }
  try {
    // Construct the chat context from the last few messages
    const chatContext = messages
      .slice(-2)
      .map((message) => {
        const content = message.content
          .map((c) => (c.type === 'text' ? c.text : '[Image]'))
          .join(' ');
        return `${message.role}: ${content}`;
      })
      .join('\n');

    // Define the prompt for the AI model
    const prompt = `
      You are an AI assistant that creates concise and obvious titles for chat sessions.
      Based on the following conversation history, generate a short and relevant title for the chat:
      ---
      ${chatContext}
      ---
      Title:
    `;

    const response = await openai.chat.completions.create({
      model: 'gemini-1.5-flash',
      messages: [
        { role: 'system', content: 'Generate concise chat titles max 4 words based on conversation context.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 16,
      temperature: 0.7,
    });

    const generatedTitle = response.choices[0]?.message?.content?.trim();
    if (!generatedTitle || generatedTitle.length === 0) {
         throw new Error('Error generating chat title: No title received');
    }

    return generatedTitle;
  } catch (error) {
    console.error('Error generating chat title:', error);
    // Display an alert to the user
        alert('Error generating chat title. Using default title.');

    return defaultTitle;
  }
}