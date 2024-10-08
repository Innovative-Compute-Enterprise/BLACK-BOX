// src/utils/chat/models/gpt35.ts

import { Message } from '@/types/chat';
import axios from 'axios';
import crypto from 'crypto';

export async function generateResponse(messages: Message[]): Promise<Message> {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Ensure this env variable is set
        },
      }
    );

    const assistantContent = response.data.choices[0].message.content.trim();

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: assistantContent,
    };
  } catch (error: any) {
    console.error('Error in GPT-3.5 Turbo API:', error.response?.data || error.message);
    throw new Error('Failed to generate response using GPT-3.5 Turbo.');
  }
}