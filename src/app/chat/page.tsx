// app/chat/page.tsx
import { Chat } from '@/src/components/chat/Chat';
import { createClient } from '@/src/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Loading from '@/src/components/chat/message/loading';
import { getUserDetails } from '@/src/utils/supabase/queries';
import { getSubscription } from '@/src/utils/supabase/queries';

export default async function ChatPage() {
  const supabase = await createClient();

  // Fetch the user from Supabase auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/0auth');
  }

  // Fetch additional user details for the full name and subscription
  const [userDetails, subscription] = await Promise.all([
    getUserDetails(supabase),
    getSubscription(supabase)
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <Chat 
        userName={userDetails?.full_name ?? ''} 
        subscription={subscription}
      />
    </Suspense>
  );
}
