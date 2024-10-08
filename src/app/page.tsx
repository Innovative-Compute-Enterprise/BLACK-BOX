// app/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Header from '@/components/ui/header/Header';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
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
      <section className="flex flex-col justify-center items-center min-h-screen px-4">
        <h1 className="text-4xl font-bold mb-4 text-center">Welcome to My AI Chat Application!</h1>
        <p className="text-lg mb-8 text-center w-[60%]">
          This is a cutting-edge chat application powered by AI, where you can have interactive conversations with an AI assistant.
          Your conversations are saved, and you can return to them anytime. Click the button below to start chatting!
        </p>
        <Link href={'/chat'}>
        <button
          className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600"
        >
          Start Chatting
        </button>
        </Link>
      </section>
    </main>
  );
}