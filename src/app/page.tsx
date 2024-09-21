import React from 'react'
import { createClient } from '@/utils/supabase/server'
import Header from '@/components/ui/header/Header'
import Chat from '@/components/chat/Chat'
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = createClient()

  const {
    data: { user }, 
  } = await supabase.auth.getUser()
  
  if(!user) {
    return redirect("/0auth")
  }

  return (
    <main className="antialiased">
      <Header />
      <section className="flex justify-center items-center min-h-screen">
        <div className="w-full">
         <Chat />
        </div>
      </section>
    </main>
  )
}