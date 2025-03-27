// src/app/layout.tsx
import { Metadata } from 'next';
import { getURL } from '@/src/utils/helpers';
import { Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from '@/src/components/ui/Toasts/toaster';
import { ThemeProvider } from '@/src/context/ThemeContext';
import '@/src/styles/main.css';

const title = 'Black Box';
const description = 'AI models and use cases for your all needs';

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  icons: '/icons/favicon.ico',
  title: title,
  description: description,
  openGraph: {
    title: title,
    description: description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <meta name="description" content={description} />
        <meta name="keywords" content="AI, Artificial Intelligence, Solutions, Future, Wealth" />
        <meta name="author" content="Black Box" />
        <title>{title}</title>
      </head>
      <body className="
        bg-white
        text-black
        dark:bg-black
        dark:text-white
        transition
        duration-300">
          <main className="min-h-[calc(100dvh-4rem)] md:min-h[calc(100dvh-5rem)]">
          <ThemeProvider>
            {children}
          </ThemeProvider>
          </main>
          <Suspense>
            <Toaster />
          </Suspense>
          <Analytics />
          <SpeedInsights />
      </body>
    </html>
  );
}