import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Space_Mono, Source_Serif_4, Press_Start_2P, VT323, Creepster, Playfair_Display, Libre_Baskerville } from "next/font/google";
import { cookieToInitialState } from "wagmi";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteStructuredData } from "@/components/site/SiteStructuredData";
import { SiteChrome } from "@/components/site/SiteChrome";
import { RequestSiteOriginProvider } from "@/lib/request-site-origin";
import { getRequestSiteOrigin, getSiteFromHost } from "@/lib/site";
import { DEFAULT_THEME } from "@/lib/theme";
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
const creepster = Creepster({
  subsets: ["latin"],
  weight: "400",
  variable: "--v0-font-creepster",
});
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--v0-font-playfair-display",
});
const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--v0-font-libre-baskerville",
});
const fontVariables = `${dmSans.variable} ${spaceMono.variable} ${sourceSerif4.variable} ${pressStart2P.variable} ${vt323.variable} ${creepster.variable} ${playfairDisplay.variable} ${libreBaskerville.variable}`;

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const site = getSiteFromHost(headerStore.get("host"));

  return {
    metadataBase: new URL(site.canonicalOrigin),
    applicationName: site.name,
    creator: site.organizationName,
    publisher: site.organizationName,
    title:
      site.key === "optimitron"
        ? "Optimitron — The Evidence-Based Earth Optimization Game"
        : site.name,
    description:
      site.key === "optimitron"
        ? "Earth Optimization Game for budgets, policies, politicians, and personal tradeoffs. Planetary debugging software for a species that keeps ignoring its own data."
        : site.description,
    keywords: [
      site.name,
      ...site.alternateSiteNames,
      "Earth Optimization Game",
      "budget optimization",
      "policy analysis",
      "public outcomes",
    ],
    openGraph: {
      siteName: site.name,
      title:
        site.key === "optimitron"
          ? "Optimitron — The Evidence-Based Earth Optimization Game"
          : site.name,
      description:
        site.key === "optimitron"
          ? "Planetary debugging software for budgets, policies, politicians, and public outcomes. See what works, what fails, and what to change next."
          : site.description,
      type: "website",
      images: [
        site.key === "optimitron"
          ? { url: "/og-image.jpg", width: 1200, height: 630, alt: "Optimitron — The Evidence-Based Earth Optimization Game" }
          : { url: site.ogImage, alt: `${site.name} social image` },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title:
        site.key === "optimitron"
          ? "Optimitron — Earth Optimization Game"
          : site.name,
      description:
        site.key === "optimitron"
          ? "Planetary debugging software for budgets, policies, politicians, and public outcomes."
          : site.description,
      images: [site.key === "optimitron" ? "/twitter-image.jpg" : site.ogImage],
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
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const cookie = headerStore.get("cookie");
  const requestOrigin = getRequestSiteOrigin({
    host: headerStore.get("host"),
    forwardedHost: headerStore.get("x-forwarded-host"),
    forwardedProto: headerStore.get("x-forwarded-proto"),
  });
  const site = getSiteFromHost(headerStore.get("host"));
  const initialState = cookieToInitialState(wagmiConfig, cookie);

  return (
    <html lang="en" className={`${DEFAULT_THEME} palette-vga`}>
      <body className={`font-sans antialiased ${fontVariables}`} suppressHydrationWarning>
        <SiteStructuredData site={site} />
        <Providers initialState={initialState}>
          <RequestSiteOriginProvider value={requestOrigin}>
            <SiteChrome>{children}</SiteChrome>
          </RequestSiteOriginProvider>
        </Providers>
      </body>
    </html>
  );
}
