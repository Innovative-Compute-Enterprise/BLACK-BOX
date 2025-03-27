// src/app/api/ai/chatGPT/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/src/lib/ai/response/chatGPT/generateResponse';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("ChatGPT API received request:", JSON.stringify(body, null, 2));
    
    const messages = body.messages;
    const systemPrompt = body.systemPrompt;
    const context = body.context || undefined;
    
    const responseMessage = await generateResponse(messages, systemPrompt, context);
    return NextResponse.json(responseMessage);
  } catch (error: any) {
    console.error("ChatGPT API error:", error);
    return NextResponse.json(
      { error: `Failed to generate response: ${error.message}` },
      { status: 500 }
    );
  }
}