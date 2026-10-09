import type { Metadata, Viewport } from "next"

import { AcceleratedMedicineTheme } from "@/components/accelerated-medicine-chrome"
import { Deck } from "@/components/present/deck"
import { alzheimers } from "@/components/present/patient-journey/alzheimers"
import { patientJourneySlides } from "@/components/present/patient-journey/slides"
import { PrintOnRequest } from "@/components/print-pdf"
import { loadScript } from "@/lib/present-script"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"

const title = "Care-Integrated Clinical Trials: The Patient Journey"

export const metadata: Metadata = {
  // Its own link preview, so a shared link does not show the home page's.
  ...rightToTrialMetadata({
    title,
    description: "How one patient gets a promising treatment through her own doctor, and how every result helps the next patient.",
    path: "/present/patient-journey",
  }),
  // A presenter's deck for meetings, linked from /resources. A deck makes a poor search result.
  robots: { index: false, follow: false },
}

// The reused components' responsive classes follow the window, and their phone layouts would not
// fit a slide. A 1280-pixel layout keeps their desktop layouts on phones, which zoom out to show it
// (Chrome zooms out to 25% at most, so wider layouts would not fit a phone screen).
export const viewport: Viewport = { width: 1280, initialScale: undefined }

// Arrow keys or space move between slides, N shows the speaker notes, F goes full screen, and
// printing saves a PDF with one page per slide (/resources links here with ?print to do that).
export default function PatientJourneyPresentation() {
  return (
    <AcceleratedMedicineTheme>
      <Deck title={title} slides={patientJourneySlides(loadScript("patient-journey"), alzheimers)} />
      <PrintOnRequest />
    </AcceleratedMedicineTheme>
  )
}
