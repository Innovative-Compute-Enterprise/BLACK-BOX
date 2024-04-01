import React from 'react';
import Header from './components/ui/header/Header'; // Ensure this is the correct path
import './globals.css';
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Black Box',
    description: 'Welcome to ICE newest product.',
  }

export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en" className='box-border antialiased'>
        <body className="overflow-x-hidden">
          <Header />
          <main>{children}</main>
        </body>
      </html>
    )
  }

