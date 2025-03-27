// src/app/api/chat-sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleChatDelete } from '@/src/utils/chat/server';
import { createClient } from '@/src/utils/supabase/server';

/**
 * Handle DELETE requests to delete a chat session.
 * Expects the sessionId in the URL and userId in the request body.
 */
export async function DELETE(request: NextRequest, context: any) {
  try {
    const supabase = await createClient();

    const { params } = context;
    const { id: sessionId } = params;
    const reqBody = await request.json();
    const { userId } = reqBody;

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'sessionId and userId are required' },
        { status: 400 }
      );
    }

    const { success } = await handleChatDelete({
      sessionId,
      userId,
      supabase,
    });

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('Error in DELETE /api/chat-sessions/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}