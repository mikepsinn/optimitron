import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Optomitron — Optimize Health, Wealth & Happiness",
  description:
    "Optomitron optimizes everyone's health, wealth, and happiness using time series data and causal inference. The operating system for evidence-based decision-making.",
  openGraph: {
    title: "Optomitron — Optimize Health, Wealth & Happiness",
    description:
      "The operating system for evidence-based decision-making. Universal causal inference engine for health, governance, and business optimization.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
