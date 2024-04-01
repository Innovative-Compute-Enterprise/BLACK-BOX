import { MonaSans } from "../fonts/font";


export default function Page() {
    return ( 
    <main className="flex items-center justify-center h-screen w-full mx-auto">
        <h1 className={`${MonaSans.className} title-font text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center`}>CHAT</h1>
    </main>
    )
  }