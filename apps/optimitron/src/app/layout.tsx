import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Space_Mono, Source_Serif_4, Press_Start_2P, VT323, Creepster, Playfair_Display, Libre_Baskerville } from "next/font/google";
import { cookieToInitialState } from "wagmi";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteStructuredData } from "@/components/site/SiteStructuredData";
import { SiteChrome } from "@/components/site/SiteChrome";
import { getRootLayoutMetadata } from "@/lib/metadata";
import { RequestSiteOriginProvider } from "@/lib/request-site-origin";
import { getRequestSiteOrigin, getSiteFromHeaders } from "@/lib/site";
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
  const site = getSiteFromHeaders(headerStore);

  return getRootLayoutMetadata(site);
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
  const site = getSiteFromHeaders(headerStore);
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
