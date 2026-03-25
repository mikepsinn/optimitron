import type { Metadata } from "next"
import { Press_Start_2P, VT323 } from "next/font/google"
import "./globals.css"

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-arcade",
})

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-terminal",
})

export const metadata: Metadata = {
  title: "OPTIMITRON - Earth Optimization Game",
  description: "Planetary debugging software. Because your species keeps ignoring its own data.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${pressStart2P.variable} ${vt323.variable} font-sans antialiased`}>
        {/* CRT Scanlines Overlay */}
        <div className="pointer-events-none fixed inset-0 z-[9999] bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15),rgba(0,0,0,0.15)_1px,transparent_1px,transparent_2px)] opacity-30" />
        {/* CRT Vignette */}
        <div className="pointer-events-none fixed inset-0 z-[9998] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        {children}
      </body>
    </html>
  )
}
