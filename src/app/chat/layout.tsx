// layout.tsx
import { cookies } from 'next/headers'
import { SidebarProvider } from "@/components/shadcn/sidebar"
import { ChatProvider } from '@/context/ChatContext'
import { ChatLayoutClient } from './chat-layout-client.tsx'
import { createClient } from '@/utils/supabase/server';
import {
  getSubscription,
} from '@/utils/supabase/queries';


interface ChatLayoutProps {
  children: React.ReactNode;
  params: { sessionId: string };
}

export default async function ChatLayout({ children, params }: ChatLayoutProps) {  
  const cookieStore = cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "false"

  const supabase = createClient();
  const subscription = await getSubscription(supabase);

  return (
    <ChatProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <ChatLayoutClient sessionId={params.sessionId} subscription={subscription}>
          {children}
        </ChatLayoutClient>
      </SidebarProvider>
    </ChatProvider>
  )
}