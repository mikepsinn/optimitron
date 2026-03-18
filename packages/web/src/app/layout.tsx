import type { Metadata } from "next";
import { DM_Sans, Space_Mono, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Providers } from "@/components/Providers";

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
const fontVariables = `${dmSans.variable} ${spaceMono.variable} ${sourceSerif4.variable}`;

export const metadata: Metadata = {
  applicationName: "Optimitron",
  title: "Optimitron — The Evidence-Based Earth Optimization Machine",
  description:
    "Earth Optimization Machine for budgets, policies, politicians, and personal tradeoffs. Planetary debugging software for a species that keeps ignoring its own data.",
  keywords: [
    "Optimitron",
    "Earth Optimization Machine",
    "planetary debugging software",
    "budget optimization",
    "policy analysis",
    "politician alignment",
    "governance",
    "public outcomes",
  ],
  openGraph: {
    siteName: "Optimitron",
    title: "Optimitron — The Evidence-Based Earth Optimization Machine",
    description:
      "Planetary debugging software for budgets, policies, politicians, and public outcomes. See what works, what fails, and what to change next.",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Optimitron — The Evidence-Based Earth Optimization Machine" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Optimitron — Earth Optimization Machine",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${fontVariables}`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
