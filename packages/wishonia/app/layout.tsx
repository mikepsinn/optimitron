import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Argue With Wishonia",
  description:
    "I've been watching your planet since 1945. Your species spends 604x more on weapons than testing which medicines work. I would like to help you stop doing that.",
  openGraph: {
    title: "Argue With Wishonia",
    type: "website",
    description:
      "I've been watching your planet since 1945. Your species spends 604x more on weapons than testing which medicines work. I would like to help you stop doing that.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en" data-bs-theme="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
