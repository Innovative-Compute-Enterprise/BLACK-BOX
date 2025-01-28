// app/chat/[sessionId]/page.tsx
import { Chat } from '@/components/chat/Chat';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Suspense } from 'react';
import Loading from '../../../../components/chat/message/loading'; // Create a loading component

interface PageProps {
  params: { sessionId: string }
}

export default async function ChatSessionPage({ params }: PageProps) {

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/0auth');
  }

  return (
    <Suspense fallback={<Loading />}> {/* Add suspense  */}
        <Chat sessionId={params.sessionId} />
    </Suspense>
  );
}