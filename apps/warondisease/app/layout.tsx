import { buildSiteMetadata, SiteRootLayout } from "@optimitron/site-kit/components/root-layout"
import type { ReactNode } from "react"
import "./globals.css"

export const dynamic = "force-dynamic"
export const generateMetadata = buildSiteMetadata

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <SiteRootLayout>{children}</SiteRootLayout>
}
