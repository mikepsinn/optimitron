import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  applicationName: "Optomitron",
  title: "Optomitron — The Evidence-Based Earth Optimization Machine",
  description:
    "Earth Optimization Machine for budgets, policies, politicians, and personal tradeoffs. Planetary debugging software for a species that keeps ignoring its own data.",
  keywords: [
    "Optomitron",
    "Earth Optimization Machine",
    "planetary debugging software",
    "budget optimization",
    "policy analysis",
    "politician alignment",
    "governance",
    "public outcomes",
  ],
  openGraph: {
    siteName: "Optomitron",
    title: "Optomitron — The Evidence-Based Earth Optimization Machine",
    description:
      "Planetary debugging software for budgets, policies, politicians, and public outcomes. See what works, what fails, and what to change next.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Optomitron — Earth Optimization Machine",
    description:
      "Planetary debugging software for budgets, policies, politicians, and public outcomes.",
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
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
