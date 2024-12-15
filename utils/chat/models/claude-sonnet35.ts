import { Message } from '@/types/chat';
import axios from 'axios';
import crypto from 'crypto';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

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

export async function generateResponse(messages: Message[]): Promise<Message> {
  try {
    const formattedMessages = await Promise.all(
      messages.map(async (msg) => {
        if (typeof msg.content === 'string') {
          return {
            role: msg.role,
            content: msg.content,
          };
        } else if (Array.isArray(msg.content)) {
          const contentItems = await Promise.all(
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
              return item;
            })
          );
          return {
            role: msg.role,
            content: contentItems,
          };
        }
        throw new Error('Invalid message content format');
      })
    );

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10, // Increased token limit
      messages: formattedMessages,
    });

    // Check if response.content exists and has items
    if (!response.content || response.content.length === 0) {
      throw new Error('No content returned from the assistant.');
    }

    // Extract text from response
    const assistantContent = response.content[0]?.text || '';

    return {
      id: response.id || crypto.randomUUID(),
      role: 'assistant',
      content: [{ type: 'text', text: assistantContent }],
      displayedContent: assistantContent,
      createdAt: Date.now(),
    };
  } catch (error: any) {
    console.error('Error details:', error);
    throw new Error(`Failed to generate response using Claude: ${error.message}`);
  }
}