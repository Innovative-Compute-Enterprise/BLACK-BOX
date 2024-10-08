// app/chat/[sessionId]/page.tsx

import Header from '@/components/ui/header/Header';
import ChatWithProvider from '@/components/chat/Chat'; // Import the default export
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ChatSessionPage({ params }) {
  const { sessionId } = params;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/0auth');
  }

  return (
    <main className="antialiased">
      <Header />
      <section className="flex justify-center items-center min-h-screen">
        <div className="w-full">
          <ChatWithProvider sessionId={sessionId} />
        </div>
      </section>
    </main>
  );
}