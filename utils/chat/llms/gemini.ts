import { Message, MessageContent } from '@/types/chat';
import crypto from 'crypto';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Define Gemini API specific interfaces
interface GeminiContentPart {
  text: string;
}

interface GeminiMessage {
    role: 'user' | 'model';
    parts: GeminiContentPart[];
}

// Convert image URLs to base64 data URLs
async function getImageDataUrl(imageUrl: string): Promise<string> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    const contentType = response.headers['content-type'];
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    return `data:${contentType};base64,${base64Image}`;
  } catch (error) {
    console.error('Error fetching image:', error.message);
    throw new Error('Failed to fetch and convert image to base64.');
  }
}

// Initialize the API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;

// Generate a response using the Google Generative AI SDK
export async function generateResponse(messages: Message[]): Promise<Message> {
  // Initialize the GoogleGenerativeAI client
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // Prepare the user messages for the API request
    const userMessages: GeminiMessage[] = await Promise.all(
      messages.map(async (msg: Message) => {
        console.log("Inspecting msg.content:", msg.content); // <-- ADD THIS LINE FOR LOGGING
        const parts = await Promise.all(
          msg.content.map(async (item) => { // <-- LINE WHERE ERROR OCCURS
            if (item.type === 'image_url') {
              const dataUrl = await getImageDataUrl(item.image_url.url);
              return { text: `Image: ${dataUrl}` };
            } else if (item.type === 'text') {
              return { text: item.text };
            }
            throw new Error('Unsupported content type');
          })
        );
        return { role: 'user', parts } as GeminiMessage;
      })
    );


    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: {
        parts: [
          {
            text: `You are a helpful assistant. Please be concise and precise.`,
          },
        ],
        role: 'model',
      },
    });

    // Define generation configuration for the model
    const generationConfig = {
      // temperature: 0.7,
      // topP: 0.95,
      // topK: 64,
      // maxOutputTokens: 1024,
    };

    // Use the GoogleGenerativeAI client to generate content
    const result = await model.generateContent({
      contents: userMessages,
      generationConfig,
    });

    // Handle the generated assistant response
    const assistantContent = result.response.candidates[0].content.parts[0].text;

    if (!assistantContent) {
      throw new Error('No content returned from the assistant.');
    }

    // Format the response as MessageContent for your app
    const contentArray: MessageContent[] = [{ type: 'text', text: assistantContent }];

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: contentArray,
      displayedContent: assistantContent,
      createdAt: Date.now(),
    };
  } catch (error: any) {
    console.error('Error:', error.message);
    throw new Error('Failed to generate response using Gemini.');
  }
}