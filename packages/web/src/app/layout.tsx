import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Space_Mono, Source_Serif_4, Press_Start_2P, VT323 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { cookieToInitialState } from "wagmi";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { GameScoreBar } from "@/components/game/GameScoreBar";
import { wagmiConfig } from "@/lib/wagmi-config";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900", "1000"],
  variable: "--v0-font-dm-sans",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--v0-font-space-mono",
});
const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--v0-font-source-serif-4",
});
const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--v0-font-press-start-2p",
});
const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--v0-font-vt323",
});
const fontVariables = `${dmSans.variable} ${spaceMono.variable} ${sourceSerif4.variable} ${pressStart2P.variable} ${vt323.variable}`;

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001"),
  ),
  applicationName: "Optimitron",
  title: "Optimitron — The Evidence-Based Earth Optimization Game",
  description:
    "Earth Optimization Game for budgets, policies, politicians, and personal tradeoffs. Planetary debugging software for a species that keeps ignoring its own data.",
  keywords: [
    "Optimitron",
    "Earth Optimization Game",
    "planetary debugging software",
    "budget optimization",
    "policy analysis",
    "politician alignment",
    "governance",
    "public outcomes",
  ],
  openGraph: {
    siteName: "Optimitron",
    title: "Optimitron — The Evidence-Based Earth Optimization Game",
    description:
      "Planetary debugging software for budgets, policies, politicians, and public outcomes. See what works, what fails, and what to change next.",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Optimitron — The Evidence-Based Earth Optimization Game" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Optimitron — Earth Optimization Game",
    description:
      "Planetary debugging software for budgets, policies, politicians, and public outcomes.",
    images: ["/twitter-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookie = (await headers()).get("cookie");
  const initialState = cookieToInitialState(wagmiConfig, cookie);

  return (
    <html lang="en" className="dark palette-vga">
      <body className={`font-sans antialiased ${fontVariables}`} suppressHydrationWarning>
        <Providers initialState={initialState}>
          <Navbar />
          <main className="min-h-screen pb-12">{children}</main>
          <Footer />
          <GameScoreBar />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
