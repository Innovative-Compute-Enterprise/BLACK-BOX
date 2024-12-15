// src/app/api/chat-sessions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { handleChatSessionsGet } from '@/utils/chat/server'; 
import { handleChatEdit } from '@/utils/chat/server'; 
import { createClient } from '@/utils/supabase/server';
import { handleSessionId } from '@/utils/chat/server';

/**
 * Handle POST requests to create a new chat session.
 * Expects the userId in the request body.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const reqBody = await request.json();
    const { userId } = reqBody;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    const { sessionId } = await handleSessionId({ userId, supabase });

    return NextResponse.json({ sessionId }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/chat-sessions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(); // Initialize within request scope

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const result = await handleChatSessionsGet({ userId, supabase });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/chat-sessions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
/**
 * Handle PUT requests to edit a chat session's title.
 * Expects a JSON body with: id (sessionId), title (newTitle), userId.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();

    const reqBody = await request.json();
    const { id: sessionId, title: newTitle, userId } = reqBody;

    const { chatHistory } = await handleChatEdit({
      sessionId,
      userId,
      newTitle,
      supabase,
    });

    return NextResponse.json({ chatHistory });
  } catch (error: any) {
    console.error('Error in PUT /api/chat-sessions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}