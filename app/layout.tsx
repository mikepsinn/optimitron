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
        {children}
      </body>
    </html>
  )
}
