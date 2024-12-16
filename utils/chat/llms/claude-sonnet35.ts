import Anthropic from '@anthropic-ai/sdk';
import { Message } from '@/types/chat';
import axios from 'axios';
import crypto from 'crypto';
import { ImageBlockParam, TextBlockParam } from '@anthropic-ai/sdk/resources';

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

export async function generateResponse(messages: Message[]): Promise<Message> {
  try {
    const formattedMessages: AnthropicMessageParam[] = await Promise.all(
      messages.map(async (msg): Promise<AnthropicMessageParam> => {
        if (typeof msg.content === 'string') {
          return {
            role: msg.role === 'system' ? 'assistant' : msg.role,
            content: msg.content,
          } as AnthropicMessageParam;
        } else if (Array.isArray(msg.content)) {
          const contentItems: (TextBlockParam | ImageBlockParam)[] = await Promise.all(
            msg.content.map(async (item): Promise<TextBlockParam | ImageBlockParam> => {
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
              return { type: 'text', text: item.text } as TextBlockParam;
            })
          );
          return {
            role: msg.role === 'system' ? 'assistant' : msg.role,
            content: contentItems,
          } as AnthropicMessageParam;
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

    // Extract text content, handling different block types
   const assistantContent = response.content
      .filter((block): block is { type: 'text'; text: string } => block.type === 'text' && 'text' in block)
      .map(block => block.text)
      .join('');

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