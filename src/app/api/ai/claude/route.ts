// src/app/api/ai/claude/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/src/lib/ai/response/claude/generateResponse';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Claude API received request:", JSON.stringify(body, null, 2));
    
    const messages = body.messages;
    const systemPrompt = body.systemPrompt;
    const context = body.context || undefined;
    
    const responseMessage = await generateResponse(messages, systemPrompt, context);
    return NextResponse.json(responseMessage);
  } catch (error: any) {
    console.error("Claude API error:", error);
    return NextResponse.json(
      { error: `Failed to generate response: ${error.message}` },
      { status: 500 }
    );
  }
}