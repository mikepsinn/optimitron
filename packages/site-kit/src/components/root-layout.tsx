import { DM_Sans, Source_Serif_4, Space_Mono } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import { getSiteConfig } from "../lib/site-config";
import { Providers } from "./providers";

export { buildSiteMetadata } from "../lib/site-metadata";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
    "1000",
  ],
  variable: "--v0-font-dm-sans",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--v0-font-space-mono",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--v0-font-source-serif-4",
});

const fontVariables = `${dmSans.variable} ${spaceMono.variable} ${sourceSerif.variable}`;

export function SiteRootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const config = getSiteConfig();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const analyticsScript = gaId
    ? `window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments)};gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{site_variant:${JSON.stringify(config.domain)}})`
    : null;

  return (
    <html lang="en">
      <body className={`font-sans antialiased ${fontVariables}`}>
        <Providers authEnabled={config.authEnabled !== false}>
          {children}
        </Providers>
        {process.env.VERCEL ? (
          <Script
            src="/_vercel/insights/script.js"
            strategy="afterInteractive"
          />
        ) : null}
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {analyticsScript}
            </Script>
          </>
        ) : null}
        {config.promotionBarEnabled ? (
          <Script
            src="https://manual.warondisease.org/assets/js/promotion-bar.js"
            strategy="lazyOnload"
          />
        ) : null}
      </body>
    </html>
  );
}
