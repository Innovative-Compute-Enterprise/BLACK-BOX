import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CURRENT_SESSION_COOKIE = 'current_session_id';

// Set session cookie
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }
    
    // Set cookie with server-side Next.js API
    const cookieStore = await cookies();
    cookieStore.set({
      name: CURRENT_SESSION_COOKIE,
      value: sessionId,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error setting session cookie:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete session cookie
export async function DELETE() {
  try {
    // Delete cookie with server-side Next.js API
    const cookieStore = await cookies();
    cookieStore.delete(CURRENT_SESSION_COOKIE);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting session cookie:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get session from cookie
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(CURRENT_SESSION_COOKIE);
    
    return NextResponse.json({
      sessionId: sessionCookie?.value || null
    });
  } catch (error: any) {
    console.error('Error getting session cookie:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 