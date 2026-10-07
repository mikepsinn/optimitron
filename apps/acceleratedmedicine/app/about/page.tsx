import type { Metadata } from "next"

import { AboutPage } from "@/components/about-page"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"

export const metadata: Metadata = rightToTrialMetadata({
  title: "About us | Care-Integrated Clinical Trials Initiative",
  description:
    "The Care-Integrated Clinical Trials Initiative is run by the Institute for Accelerated Medicine, a 501(c)(3) nonprofit. Its board, advisory board, research and legal facts.",
  path: "/about",
})

export default AboutPage
