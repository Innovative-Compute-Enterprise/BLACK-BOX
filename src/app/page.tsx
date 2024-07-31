import React from 'react'
import { createClient } from '@/utils/supabase/server'
import Header from '@/components/ui/Header/Header'
import { redirect } from 'next/navigation';

export default async function PrivatePage() {
  const supabase = createClient()

  /// TO BE REMOVED 1/3
  debugger

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
        <div className="max-w-[1440px] w-full">
        </div>
      </section>
    </main>
  )
}