import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Press_Start_2P, VT323 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import '../styles/sierra.css'

const _geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const _pressStart2P = Press_Start_2P({ 
  weight: "400", 
  subsets: ["latin"], 
  variable: "--font-pixel" 
});
const _vt323 = VT323({ 
  weight: "400", 
  subsets: ["latin"], 
  variable: "--font-terminal" 
});

export const metadata: Metadata = {
  title: 'The Earth Optimization Game',
  description: 'A Sierra-style adventure in civilizational reallocation. Redirect 1% of military spending to clinical trials and save 10.7 billion lives.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${_pressStart2P.variable} ${_vt323.variable}`}>
      <body className="font-sans antialiased bg-black text-white">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
