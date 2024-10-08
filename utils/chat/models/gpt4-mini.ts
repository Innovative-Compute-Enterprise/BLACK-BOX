// src/utils/chat/models/gpt4o.ts

import { Message } from '@/types/chat';
import axios from 'axios';
import crypto from 'crypto'; 

export async function generateResponse(messages: Message[]): Promise<Message> {
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini', 
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        // temperature: 0.7, // Optional: Adjust as needed
        // max_tokens: 100, 
        // top_p: 1, // Optional: Adjust as needed
        // frequency_penalty: 0, // Optional: Adjust as needed
        // presence_penalty: 0, // Optional: Adjust as needed
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Ensure this env variable is set
          'OpenAI-Organization': 'org-4fLbQ7YLVgAmao8WCw7BSZmk', // Add if needed
          'OpenAI-Project': process.env.OPENAI_PROJECT_ID, // Add if using project keys
        },
      }
    );

    // Log Request ID for debugging
    const requestId = response.headers['x-request-id'];
    console.log(`Request ID: ${requestId}`);

    // Log Rate Limiting Info (Optional)
    const rateLimitRemainingRequests = response.headers['x-ratelimit-remaining-requests'];
    const rateLimitRemainingTokens = response.headers['x-ratelimit-remaining-tokens'];
    console.log(`Rate Limit Remaining Requests: ${rateLimitRemainingRequests}`);
    console.log(`Rate Limit Remaining Tokens: ${rateLimitRemainingTokens}`);

    // Ensure the response structure matches the expected format
    const assistantContent = response.data.choices[0]?.message?.content;

    if (!assistantContent) {
      throw new Error('No content returned from the assistant.');
    }

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: assistantContent,
    };
  } catch (error: any) {
    if (error.response) {
      console.error('Error in GPT-4o API:', error.response.data);
      console.error('Request ID:', error.response.headers['x-request-id']);
      console.error('Rate Limit Remaining Requests:', error.response.headers['x-ratelimit-remaining-requests']);
      console.error('Rate Limit Remaining Tokens:', error.response.headers['x-ratelimit-remaining-tokens']);
    } else {
      console.error('Error in GPT-4o API:', error.message);
    }
    throw new Error('Failed to generate response using GPT-4o.');
  }
}