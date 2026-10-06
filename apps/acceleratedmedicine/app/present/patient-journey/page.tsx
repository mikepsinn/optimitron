import type { Metadata, Viewport } from "next"

import { AcceleratedMedicineTheme } from "@/components/accelerated-medicine-chrome"
import { Deck } from "@/components/present/deck"
import { alzheimers } from "@/components/present/patient-journey/alzheimers"
import { patientJourneySlides } from "@/components/present/patient-journey/slides"
import { loadScript, onScreenOnly } from "@/lib/present-script"
import { canSeeSpeakerNotes } from "@/lib/presenter-access"

const title = "Care-Integrated Clinical Trials: The Patient Journey"

export const metadata: Metadata = {
  title,
  description: "How one patient gets a promising treatment through her own doctor, and how every result helps the next patient.",
  // A presenter's deck for meetings. Share the link directly; nothing on the site links to it.
  robots: { index: false, follow: false },
}

// The reused components' responsive classes follow the window, and their phone layouts would not
// fit a slide. A 1280-pixel layout keeps their desktop layouts on phones, which zoom out to show it
// (Chrome zooms out to 25% at most, so wider layouts would not fit a phone screen).
export const viewport: Viewport = { width: 1280, initialScale: undefined }

// Arrow keys or space move between slides, F goes full screen, and printing saves a PDF with one
// page per slide. A signed-in admin also gets the speaker notes (N), which hold the in-person ask
// to legislators.
export default async function PatientJourneyPresentation() {
  const presenter = await canSeeSpeakerNotes()
  const script = loadScript("patient-journey")
  return (
    <AcceleratedMedicineTheme>
      <Deck title={title} slides={patientJourneySlides(presenter ? script : script.map(onScreenOnly), alzheimers)} />
    </AcceleratedMedicineTheme>
  )
}
