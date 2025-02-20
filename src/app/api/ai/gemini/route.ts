// src/app/api/ai/chatGPT/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/ai/response/gemini/generateResponse'; // Adjust the path as needed

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = body.messages; 
    const responseMessage = await generateResponse(messages);
    return NextResponse.json(responseMessage);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}