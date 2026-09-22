import type { Metadata } from "next"

import { AboutPage } from "@/components/about-page"
import { getPageMetadata } from "@optimitron/site-kit/lib/nav-items"

export const metadata: Metadata = getPageMetadata("aboutUs")

export default AboutPage
