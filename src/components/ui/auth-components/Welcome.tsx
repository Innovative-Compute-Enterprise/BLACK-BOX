import Button from "@/src/components/ui/Button";
import Link from 'next/link';
import { MonaSans } from "@/src/styles/fonts/font";
import BlackBox from "../../icons/BlackBox"; // Make sure this path is correct

export default async function Welcome() {
  return (
    // Main container: Added bg-white for light mode default, dark:bg-black for dark mode
    <section className="flex flex-col md:flex-row min-h-screen w-full">

      {/* Left Section: Text Content + Icon */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16 lg:p-24 order-2 md:order-1 text-black dark:text-white">
        {/* Container for icon + text block */}
        <div className="max-w-md mx-auto md:mx-0 flex flex-col items-center md:items-start"> {/* Center items on mobile, start on desktop */}

          {/* BlackBox Icon */}
          <BlackBox className="w-12 h-12 md:w-16 md:h-16 mb-6" /> {/* Added icon with size and margin */}

          {/* Heading */}
          <h1
            className={`${MonaSans.className} uppercase text-6xl md:text-7xl lg:text-8xl font-[900] mb-4 md:mb-6 leading-tight text-center md:text-left`}
            style={{ fontStretch: "125%" }}
          >
            Welcome to <br /> Black Box
          </h1>

          {/* Adjusted text color for light/dark modes */}
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 text-center md:text-left">
            Brought to you by <Link href="https://blackbox.com" className="underline hover:text-black dark:hover:text-white">ICE</Link>.
          </p>
        </div>
      </div>

      {/* Right Section: Action Buttons */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 lg:p-24 order-1 md:order-2">
        <div className="w-full max-w-xs space-y-4">

          {/* Entrar Button (Primary) */}
          <Link href="/0auth/password_signin" className="block" passHref>
            <Button
              variant="flat" // Assuming 'flat' allows className overrides or you have specific variants
              type="button"
              className="w-full py-3 text-lg font-medium rounded-md transition-colors duration-200
                         bg-black text-white hover:bg-zinc-800
                         dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Entrar
            </Button>
          </Link>

          {/* Criar conta Button (Secondary/Outline) */}
          <Link href="/0auth/signup" className="block" passHref>
            <Button
              variant="flat" // Assuming 'flat' allows className overrides or you have specific variants
              type="button"
              className="w-full py-3 text-lg font-medium rounded-md border transition-colors duration-200
                         border-black  hover:bg-zinc-800
                         dark:border-gray-600 dark:text-black text-white dark:hover:bg-gray-200 dark:hover:border-gray-800"
            >
              Criar conta
            </Button>
          </Link>
        </div>
      </div>

    </section>
  );
}