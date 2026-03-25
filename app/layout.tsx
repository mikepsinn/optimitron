import type { Metadata } from "next"
import "./globals.css"

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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {/* CRT Scanlines Overlay */}
        <div className="pointer-events-none fixed inset-0 z-[9999] bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15),rgba(0,0,0,0.15)_1px,transparent_1px,transparent_2px)] opacity-30" />
        {/* CRT Vignette */}
        <div className="pointer-events-none fixed inset-0 z-[9998] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        {children}
      </body>
    </html>
  )
}
