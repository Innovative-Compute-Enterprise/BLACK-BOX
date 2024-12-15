// app/chat/page.tsx
import Chat from '@/components/chat/Chat';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ChatPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/0auth');
  }

  return (
    <>
      <Chat />
    </>
  );
}