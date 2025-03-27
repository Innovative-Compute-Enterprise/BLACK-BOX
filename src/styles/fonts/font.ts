import localFont from 'next/font/local'
import { Roboto_Mono } from 'next/font/google'

export const Roboto = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
});

export const MonaSans = localFont({
  src: '../../../public/fonts/MonaSans.woff2',
  display: 'swap',
});