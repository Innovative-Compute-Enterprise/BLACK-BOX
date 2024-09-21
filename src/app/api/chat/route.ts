// src/app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { handlePost, handleGet } from '@/utils/chat/server'; // Adjust the import path as needed
import { createClient } from '@/utils/supabase/server';

/**
 * Handle POST requests to send a message.
 * Expects a JSON body with: userId, content, sessionId (optional), model.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(); 

    const reqBody = await request.json();
    const { content, sessionId, userId, model } = reqBody;

    const result = await handlePost({ content, sessionId, userId, model, supabase });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Handle GET requests to retrieve messages for a specific session.
 * Expects a query parameter: sessionId
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(); 

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const result = await handleGet({ sessionId, supabase });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}