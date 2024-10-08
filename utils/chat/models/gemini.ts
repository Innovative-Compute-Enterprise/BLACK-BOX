// src/utils/chat/models/gemini.ts

import { Message } from '@/types/chat';
import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Ensure the API key is retrieved from the environment
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables.');
}

/**
 * Generates a response from the Gemini model based on the provided messages.
 * @param messages - An array of Message objects representing the conversation history.
 * @returns A Promise that resolves to a Message object containing the assistant's response.
 */
export async function generateResponse(messages: Message[]): Promise<Message> {
  try {
    // Initialize the GoogleGenerativeAI instance with the API key
    const genAI = new GoogleGenerativeAI(apiKey);

    // Configure the generative model with system instructions
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: {
        parts: [
          {
            text: `You are a helpful assistant. Please be concise and precise.`,
          },
        ],
        role: 'model',
      },
    });

    // Transform the incoming messages to match the expected format
    const userMessages = messages.map((msg: Message) => ({
      role: 'user',
      parts: [{ text: msg.content }],
    }));

    // Define generation configuration
    const generationConfig = {
      //temperature: 1,
      //topP: 0.95,
      //topK: 64,
      //maxOutputTokens: 8192,
      //responseMimeType: 'application/json',
    };

    // Generate content using the model
    const result = await model.generateContent({
      contents: userMessages,
      generationConfig,
    });

    console.log('Gemini API Full Result:', JSON.stringify(result, null, 2));

    // Handle potential prompt feedback/blocking
    if (
      result.response.promptFeedback &&
      result.response.promptFeedback.blockReason
    ) {
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Blocked for ${result.response.promptFeedback.blockReason}`,
      };
    }

    // Extract the response text
    const responseText = result.response.candidates[0].content.parts[0].text;

    if (!responseText) {
      throw new Error('No content returned from the Gemini API.');
    }

    // Parse the JSON response as per system instruction
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: responseText, // Utilizando o texto diretamente
    };
    // Return the formatted assistant message
    return assistantMessage;

  } catch (error: any) {
    // Detailed error logging
    if (error.response) {
      console.error('Gemini API Error:', error.response.data);
      console.error('Request ID:', error.response.headers['x-request-id']);
      console.error('Rate Limit Remaining Requests:', error.response.headers['x-ratelimit-remaining-requests']);
      console.error('Rate Limit Remaining Tokens:', error.response.headers['x-ratelimit-remaining-tokens']);
    } else {
      console.error('Gemini API Error:', error.message);
    }

    // Return an error message as a Message object
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Failed to generate response using Gemini.',
    };
  }
}
