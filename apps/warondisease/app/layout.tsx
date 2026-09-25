import type { ReactNode } from "react"
import { appNavigation } from "../lib/navigation"
import { buildSiteStructuredData } from "../lib/structured-data"
import { buildSiteMetadata, SiteRootLayout } from "@optimitron/site-kit/components/root-layout"
import { JsonLdScript } from "@optimitron/site-kit/components/site/JsonLdScript"
import "./globals.css"

export const dynamic = "force-dynamic"
export const generateMetadata = buildSiteMetadata

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <SiteRootLayout navigation={appNavigation}>
      <JsonLdScript data={buildSiteStructuredData()} />
      {children}
    </SiteRootLayout>
  )
}
