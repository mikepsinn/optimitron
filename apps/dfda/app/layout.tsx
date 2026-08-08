import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { GoogleAnalytics } from "@next/third-parties/google"
import Script from "next/script"
import * as Sentry from "@sentry/nextjs"
import { headers } from "next/headers"
import "./globals.css"
import { Providers } from "@/components/providers"
import { getSiteConfigForVariant, getSiteVariantForHost, getBaseUrl } from "@/lib/site-config"
import type { SiteVariant } from "@/lib/site-variant-types"

import { DM_Sans as V0_Font_DM_Sans, Space_Mono as V0_Font_Space_Mono, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'

// Force dynamic rendering - Layout is a client component with navigation state
export const dynamic = 'force-dynamic'

// `@apps/dfda` shares the site-kit package with other brand apps, and
// site-kit's `getSiteConfig()` always resolves the package's fixed
// `APP_BRAND` (warondisease.org) — it never reflects which app is actually
// running. Resolve the variant the same way middleware.ts does: respect
// NEXT_PUBLIC_SITE_VARIANT in local dev, otherwise derive it from the
// incoming request's Host header so metadata/icons/nav match this app.
async function resolveRequestSiteConfig() {
  const variant: SiteVariant =
    process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_SITE_VARIANT
      ? (process.env.NEXT_PUBLIC_SITE_VARIANT as SiteVariant)
      : getSiteVariantForHost((await headers()).get("host"))
  return getSiteConfigForVariant(variant)
}

// Initialize fonts
const _dmSans = V0_Font_DM_Sans({ subsets: ['latin'], weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900", "1000"], variable: '--v0-font-dm-sans' })
const _spaceMono = V0_Font_Space_Mono({ subsets: ['latin'], weight: ["400", "700"], variable: '--v0-font-space-mono' })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200", "300", "400", "500", "600", "700", "800", "900"], variable: '--v0-font-source-serif-4' })
const _v0_fontVariables = `${_dmSans.variable} ${_spaceMono.variable} ${_sourceSerif_4.variable}`

export async function generateMetadata(): Promise<Metadata> {
  const config = await resolveRequestSiteConfig()
  const baseUrl = getBaseUrl()

  return {
    title: config.title,
    description: config.description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: config.canonicalUrl || baseUrl,
    },
    // Use dynamic icons from config (required for all variants)
    icons: config.icons,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: baseUrl,
      siteName: config.title,
      title: config.ogMetadata.title || config.title,
      description: config.ogMetadata.description || config.description,
      images: [
        {
          url: config.ogMetadata.image,
          width: config.ogMetadata.width,
          height: config.ogMetadata.height,
          alt: config.ogMetadata.alt || config.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: config.ogMetadata.title || config.title,
      description: config.ogMetadata.description || config.description,
      images: [config.ogMetadata.twitterImage?.url || config.ogMetadata.image],
    },
    other: {
      ...Sentry.getTraceData(),
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const config = await resolveRequestSiteConfig()
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <html lang="en">
      <body className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable} ${_v0_fontVariables}`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
        {gaId && (
          <>
            <GoogleAnalytics gaId={gaId} />
            <Script id="ga-site-config" strategy="afterInteractive">
              {`window.gtag&&window.gtag('set','user_properties',{site_variant:'${config.domain}'})`}
            </Script>
          </>
        )}
        {/* Cross-site promotion bar — hidden for survey variant (nonprofit-neutral) */}
        {config.showPoliticalContent && (
          <Script
            src="https://manual.warondisease.org/assets/js/promotion-bar.js"
            strategy="lazyOnload"
          />
        )}
      </body>
    </html>
  )
}
