import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Optomitron — Evidence-Based Policy to Minimize Suffering and Save Lives",
  description:
    "Causal inference on policy, budget, and outcome data across 20+ countries to identify what actually minimizes suffering and extends healthy lives.",
  openGraph: {
    title: "Optomitron — Evidence-Based Policy to Minimize Suffering and Save Lives",
    description:
      "Which interventions minimize suffering and save the most lives? Causal analysis of natural experiments and policy outcomes across jurisdictions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
