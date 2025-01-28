// app/chat/page.tsx
import { Chat } from '@/components/chat/Chat';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Loading from './../../../components/chat/message/loading'; // Create a loading component


export default async function ChatPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/0auth');
  }

  return (
    <Suspense fallback={<Loading />}> {/* Add suspense for smoother loading */}
        <Chat />
    </Suspense>
  );
}