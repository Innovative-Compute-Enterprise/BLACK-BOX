import Header from '@/components/ui/header/Header';
import ChatWithProvider from '@/components/chat/Chat';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ChatPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    throw redirect('/0auth');
  }

  return (
    <main className="antialiased">
      <Header />
      <section className="flex justify-center items-center min-h-screen">
        <div className="w-full">
          <ChatWithProvider /> {/* No sessionId prop here */}
        </div>
      </section>
    </main>
  );
}