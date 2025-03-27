"use server";

import { Message, MessageContent } from '@/src/types/chat';
import axios from 'axios';
import crypto from 'crypto';
import { cleanAIResponse } from "@/src/lib/utils";

// Function to fetch image data and convert it to a base64 data URL
async function getImageDataUrl(imageUrl: string): Promise<string> {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'];
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    return `data:${contentType};base64,${base64Image}`;
  } catch (error) {
    console.error('Error fetching image:', error.message);
    throw new Error('Failed to fetch and convert image to base64.');
  }
}

// Main function to generate a response using the ChatGPT API
export async function generateResponse(
  messages: Message[],
  systemPrompt: string,
  context?: any[],
  files?: any[]
): Promise<Message> {
  try {
    // Convert messages to the format expected by the OpenAI API
    const formattedMessages = await Promise.all(
      messages.map(async (msg) => {
        const contentItems = await Promise.all(
          msg.content.map(async (item) => {
            if (item.type === 'image_url') {
              const dataUrl = await getImageDataUrl(item.image_url.url);
              return { type: 'image_url', image_url: { url: dataUrl } };
            }
            return item;
          })
        );
        return { role: msg.role, content: contentItems };
      })
    );

    // Include the system prompt as the initial message
    const allMessages = [
      { role: 'system', content: systemPrompt },
      ...formattedMessages,
    ];

    const requestOptions: any = {
      model: 'gpt-4o-mini',
      messages: allMessages,
    };

    if (context && context.length > 0) {
      // Example: Adding context as additional messages
      context.forEach((ctx) => {
        allMessages.push({ role: 'system', content: ctx });
      });
    }

    if (files && files.length > 0) {
      const lastUserMessageIndex = formattedMessages.findIndex(
        (msg) => msg.role === 'user'
      );

      if (lastUserMessageIndex !== -1) {
        for (const file of files) {
          if (file.isImage) {
            // For images, convert to data URL and add to message
            const dataUrl = await getImageDataUrl(file.url);
            formattedMessages[lastUserMessageIndex].content.push({
              type: 'image_url',
              image_url: { url: dataUrl },
            });
          } else {
            // Handle non-image files based on MIME type
            if (file.mime_type.includes('text') || 
                file.mime_type.includes('json') || 
                file.mime_type.includes('csv')) {
              try {
                // For text-based files, fetch the content and include it
                const response = await axios.get(file.url);
                formattedMessages[lastUserMessageIndex].content.push({
                  type: 'text',
                  text: `File content (${file.name}, ${file.mime_type}):\n${response.data}`
                });
              } catch (error) {
                console.error(`Error fetching file: ${file.name}`, error);
                formattedMessages[lastUserMessageIndex].content.push({
                  type: 'text',
                  text: `Unable to retrieve file: ${file.name} (${file.mime_type})`
                });
              }
            } else {
              // For other file types, just include info about the file
              formattedMessages[lastUserMessageIndex].content.push({
                type: 'text',
                text: `File attachment: ${file.name} (${file.mime_type}, size: ${(file.size / 1024).toFixed(2)} KB)`
              });
            }
          }
        }
      }
    }

    // Make the API request to OpenAI's ChatGPT endpoint
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      requestOptions,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          // Include the Organization ID if applicable
          // 'OpenAI-Organization': process.env.OPENAI_ORG_ID,
        },
      }
    );

    // Extract the assistant's response from the API response
    let assistantContent;
    if (typeof response.data.choices[0]?.message?.content === 'string') {
      assistantContent = response.data.choices[0].message.content;
    } else if (Array.isArray(response.data.choices[0]?.message?.content)) {
      assistantContent = response.data.choices[0].message.content
        .map((item) => (item.type === 'text' ? item.text : ''))
        .join('\n');
    } else {
      throw new Error('Assistant content is in an unexpected format.');
    }

    // Clean the assistant's content
    const cleanedContent = cleanAIResponse(assistantContent);

    // Return the formatted response
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: [{ type: 'text', text: cleanedContent }],
      displayedContent: cleanedContent,
      createdAt: Date.now(),
    };
  } catch (error: any) {
    console.error('Error:', error.message);
    throw new Error('Failed to generate response using GPT-4.');
  }
}
