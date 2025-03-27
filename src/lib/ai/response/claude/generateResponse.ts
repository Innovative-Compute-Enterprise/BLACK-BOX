"use server"

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Message } from '@/src/types/chat';
import axios from 'axios';
import crypto from 'crypto';
import { ImageBlockParam, TextBlockParam } from '@anthropic-ai/sdk/resources';
import { cleanAIResponse } from '@/src/lib/utils';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

interface AnthropicMessageParam {
  role: 'user' | 'assistant';
  content: string | (TextBlockParam | ImageBlockParam)[];
}

async function getImageDataUrl(imageUrl: string): Promise<string> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    const contentType = response.headers['content-type'];
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    return `data:${contentType};base64,${base64Image}`;
  } catch (error) {
    console.error('Error fetching image:', error);
    throw new Error('Failed to fetch and convert image to base64.');
  }
}

// Updated to accept context parameter
export async function generateResponse(
  messages: Message[],
  systemPrompt: string,
  context?: any[],
  files?: any[]
): Promise<Message> {
  try {
    // Format system prompt with context if available
    let enhancedSystemPrompt = systemPrompt;

    if (context && context.length > 0) {
      const contextText = context.map(item => {
        return `[${item.title || 'Reference'}]\n${item.content || item.text || JSON.stringify(item)}`;
      }).join('\n\n');
      
      enhancedSystemPrompt += `\n\nHere is additional context that might be helpful for answering:\n${contextText}`;
    }

        // Process file attachments if available
    // Process file attachments if available
    if (files && files.length > 0 && messages.length > 0) {
      // Get the most recent user message
      const lastUserMessageIndex = messages.findIndex(
        (msg, idx, arr) => msg.role === 'user' && (idx === arr.length - 1 || arr[idx + 1].role !== 'user')
      );

      if (lastUserMessageIndex !== -1) {
        // Ensure the message content is an array
        if (typeof messages[lastUserMessageIndex].content === 'string') {
          messages[lastUserMessageIndex].content = [{ 
            type: 'text', 
            text: messages[lastUserMessageIndex].content as string 
          }];
        }
        
        // Convert FileAttachment objects to the format expected by Claude API
        for (const file of files) {
          if (Array.isArray(messages[lastUserMessageIndex].content)) {
            if (file.isImage) {
              // For images, we'll add a properly formatted image_url object
              messages[lastUserMessageIndex].content.push({
                type: 'image_url',
                image_url: { url: file.url }
              });
            } else {
              // For non-image files, add as text with information about the file
              // For text-based files, we could try to fetch and include content
              if (file.mime_type.includes('text') || 
                  file.mime_type.includes('json') || 
                  file.mime_type.includes('csv')) {
                try {
                  const response = await axios.get(file.url);
                  messages[lastUserMessageIndex].content.push({
                    type: 'text',
                    text: `File content (${file.name}, ${file.mime_type}):\n${response.data}`
                  });
                } catch (error) {
                  console.error(`Error fetching file: ${file.name}`, error);
                  messages[lastUserMessageIndex].content.push({
                    type: 'text',
                    text: `Unable to retrieve file: ${file.name} (${file.mime_type})`
                  });
                }
              } else {
                // For other files, add a description
                messages[lastUserMessageIndex].content.push({
                  type: 'text',
                  text: `File attachment: ${file.name} (${file.mime_type}, size: ${(file.size / 1024).toFixed(2)} KB)`
                });
              }
            }
          }
        }
      }
    }
    // Add system message with enhanced prompt
    const allMessages = [
      {
        role: 'system',
        content: enhancedSystemPrompt
      },
      ...messages
    ];

    const formattedMessages: AnthropicMessageParam[] = await Promise.all(
      allMessages.map(async (msg): Promise<AnthropicMessageParam> => {
        if (typeof msg.content === 'string') {
          return {
            role: (msg.role === 'system' ? 'assistant' : msg.role) as 'user' | 'assistant',
            content: msg.content,
          };
        } else if (Array.isArray(msg.content)) {
          const contentItems: (TextBlockParam | ImageBlockParam)[] = await Promise.all(
            msg.content.map(async (item) => {
              if (item.type === 'image_url') {
                const dataUrl = await getImageDataUrl(item.image_url.url);
                return {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: dataUrl.split(',')[1],
                  },
                };
              }
              if (item.type === 'text') {
                return { type: 'text', text: item.text };
              } else if (item.type === 'file_url') {
                return {
                  type: 'text',
                  text: `File attachment: ${item.file_url.url}${item.mime_type ? ` (${item.mime_type})` : ''}${item.file_name ? `, ${item.file_name}` : ''}`
                };
              } else {
                throw new Error(`Unsupported message block type: ${item}`);
              }
            }) 
          );
          return {
            role: (msg.role === 'system' ? 'assistant' : msg.role) as 'user' | 'assistant',
            content: contentItems,
          };
        }
        throw new Error('Invalid message content format');
      })
    );

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: formattedMessages,
    });

    if (!response.content || response.content.length === 0) {
      throw new Error('No content returned from the assistant.');
    }

    // Extract text content from the response blocks
    const assistantContent = response.content
      .filter((block): block is { type: 'text'; text: string } => block.type === 'text' && 'text' in block)
      .map(block => block.text)
      .join('');

    // Clean the AI response to remove artifacts
    const cleanedContent = cleanAIResponse(assistantContent);

    return {
      id: response.id || crypto.randomUUID(),
      role: 'assistant',
      content: [{ type: 'text', text: cleanedContent }],
      displayedContent: cleanedContent,
      createdAt: Date.now(),
    };
  } catch (error: any) {
    console.error('Error details:', error);
    throw new Error(`Failed to generate response using Claude: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages: Message[] = body.messages; 
    const systemPrompt = body.systemPrompt;
    const context = body.context;
    const files = body.files;
    const responseMessage = await generateResponse(messages, systemPrompt, context, files);
    return NextResponse.json(responseMessage);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}