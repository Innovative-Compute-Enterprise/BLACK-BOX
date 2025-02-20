// src/app/api/ai/chatGPT/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Message, MessageContent } from '@/types/chat';
import axios from 'axios';
import crypto from 'crypto';

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

export async function generateResponse(messages: Message[]): Promise<Message> {
  try {
    // Prepare the messages in the format expected by the OpenAI API
    const formattedMessages = await Promise.all(
      messages.map(async (msg) => {
        if (Array.isArray(msg.content)) {
          // Convert image URLs to base64 data URLs
          const contentItems = await Promise.all(
            msg.content.map(async (item) => {
              if (item.type === 'image_url') {
                const dataUrl = await getImageDataUrl(item.image_url.url);
                return {
                  type: 'image_url',
                  image_url: {
                    url: dataUrl,
                  },
                };
              } else {
                return item;
              }
            })
          );

          return {
            role: msg.role,
            content: contentItems,
          };
        } else {
          throw new Error('message.content should be an array of MessageContent');
        }
      })
    );

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: formattedMessages,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          Organization: process.env.OPENAI_ORG_ID,
        },
      }
    );

    const assistantContent = response.data.choices[0]?.message?.content;

    if (!assistantContent) {
      throw new Error('No content returned from the assistant.');
    }

    // Handle the assistant's response
    let contentArray: MessageContent[];

    if (Array.isArray(assistantContent)) {
      contentArray = assistantContent;
    } else if (typeof assistantContent === 'string') {
      contentArray = [{ type: 'text', text: assistantContent }];
    } else {
      throw new Error('Assistant content is in an unexpected format.');
    }

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: contentArray,
      displayedContent: contentArray
        .map((item) => (item.type === 'text' ? item.text : ''))
        .join('\n'),
      createdAt: Date.now(),
    };
  } catch (error: any) {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    throw new Error('Failed to generate response using GPT-4.');
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages: Message[] = body.messages; 
    const responseMessage = await generateResponse(messages);
    return NextResponse.json(responseMessage);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}