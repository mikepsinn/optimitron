import * as Sentry from "@sentry/nextjs"
import type { Metadata } from "next"
import Script from "next/script"
import type { ReactNode } from "react"

import { inter } from "@/lib/fonts"
import { SITE } from "@/lib/site-settings"
import "./globals.css"

export const dynamic = "force-dynamic"

/** Defaults for every page. Pages that set their own title, description or share blocks override these. */
export function generateMetadata(): Metadata {
  return {
    title: SITE.title,
    description: SITE.description,
    metadataBase: new URL(SITE.url),
    // Next resolves ./ against each page's own path, so every page is its own canonical address.
    alternates: { canonical: "./" },
    icons: SITE.icons,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: SITE.url,
      siteName: SITE.title,
      title: SITE.title,
      description: SITE.description,
      images: [
        {
          url: SITE.openGraphImage.path,
          width: SITE.openGraphImage.width,
          height: SITE.openGraphImage.height,
          alt: SITE.openGraphImage.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE.title,
      description: SITE.description,
      images: [SITE.openGraphImage.path],
    },
    // Links Sentry's browser traces to the server request that rendered the page.
    other: { ...Sentry.getTraceData() },
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
        {process.env.VERCEL ? <Script src="/_vercel/insights/script.js" strategy="afterInteractive" /> : null}
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="beforeInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments)};gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{site_variant:"acceleratedmedicine.org"})`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  )
}
