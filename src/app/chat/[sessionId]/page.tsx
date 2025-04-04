// app/chat/[sessionId]/page.tsx
import { Chat } from '@/src/components/chat/Chat';
import { redirect } from 'next/navigation';
import { createClient } from '@/src/utils/supabase/server';
import { Suspense } from 'react';
import Loading from '@/src/components/chat/message/loading'; 
import { getUserDetails } from '@/src/utils/supabase/queries';
import { getSubscription } from '@/src/utils/supabase/queries';

interface PageProps {
  params: Promise<{ sessionId: string }>; 
}

export default async function ChatSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const awaitedParams = await params; 
  const { sessionId } = awaitedParams; 

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/0auth');
  }

  // Fetch additional user details and subscription
  const [userDetails, subscription] = await Promise.all([
    getUserDetails(supabase),
    getSubscription(supabase)
  ]);

  return (
    <Suspense fallback={<Loading />}>
        <Chat sessionId={sessionId} userName={userDetails?.full_name ?? ''} subscription={subscription} />
    </Suspense>
  );
}