import type { Metadata } from "next"

import { AboutPage } from "@/components/about-page"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"

export const metadata: Metadata = rightToTrialMetadata({
  title: "About us | Care-Integrated Clinical Trials Initiative",
  description:
    "Learn about the Care-Integrated Clinical Trials Initiative: who we are, our research and the advisory board.",
  path: "/about",
})

export default AboutPage
