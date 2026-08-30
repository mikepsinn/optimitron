import { buildSiteMetadata, SiteRootLayout } from "@optimitron/site-kit/components/root-layout"
import { Libre_Baskerville } from "next/font/google"
import type { ReactNode } from "react"
import "./globals.css"

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--v0-font-libre-baskerville",
})

export const dynamic = "force-dynamic"
export const generateMetadata = buildSiteMetadata

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <SiteRootLayout>
      <div className={libreBaskerville.variable}>{children}</div>
    </SiteRootLayout>
  )
}
