// app/chat/[sessionId]/page.tsx
import { Chat } from '@/components/chat/Chat';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Suspense } from 'react';
import Loading from '../../../../components/chat/message/loading'; 

interface PageProps {
  params: Promise<{ sessionId: string }>; 
}

export default async function ChatSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const awaitedParams = await params; 
  const { sessionId } = awaitedParams; 

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/0auth');
  }

  return (
    <Suspense fallback={<Loading />}> {/* Add suspense  */}
        <Chat sessionId={sessionId} /> {/* Use sessionId from awaited params */}
    </Suspense>
  );
}