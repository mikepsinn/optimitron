import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wishonia — AI Governance Narrator",
  description: "Embeddable AI character with real-time narration powered by Gemini Live",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
