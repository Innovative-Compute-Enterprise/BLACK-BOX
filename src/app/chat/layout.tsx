// ChatLayout.tsx
import { cookies } from "next/headers";
import { SidebarProvider } from "@/src/components/shadcn/sidebar";
import { ChatProvider } from "@/src/context/ChatContext";
import { createClient } from "@/src/utils/supabase/server";
import { getSubscription } from "@/src/utils/supabase/queries";

interface ChatLayoutProps {
  children: React.ReactNode;
  params: { sessionId: string };
}

export default async function ChatLayout({
  children,
  params,
}: ChatLayoutProps) {
  // FIX: Await the cookies() function
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "false";

  const supabase = await createClient();
  let subscription = null;

  try {
    subscription = await getSubscription(supabase);
  } catch (error) {
    console.error("Error fetching subscription:", error);
  }

  return (
    <ChatProvider>

          {children}

    </ChatProvider>
  );
}
