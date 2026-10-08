// Common questions about the act, from the deck's speaker notes (content/patient-journey/script.md). The act
// page shows all of them, and the FAQ reuses them, so the answers live in one place.
/** `source` backs a figure in the answer and shows under it. */
export type ActQuestion = { id: string; question: string; answer: string[]; source?: { href: string; label: string } }

export const ACT_QUESTIONS: ActQuestion[] = [
  {
    id: "who-pays",
    question: "Who pays, and what does it cost the state?",
    answer: [
      "No insurer or state program has to pay. The patient, family, charities, employers, research sponsors, and insurers that choose to can pay.",
      "Clinics may charge for treatment, so they have a reason to offer new treatments, and one board approval can cover many clinics. Other ways to pay include installments or memberships, crowdfunding, patient-aid groups, free supply from the maker, and lower prices for patients who agree to share more data than the required outcome record.",
      "Running the act costs the state about $200,000 to $500,000 a year by our estimate, with a planning figure of $300,000. It is not an official fiscal note. The state pays for no treatment, runs no trial platform or database, and licenses no facilities. Review-board fees, $500 to register and $250 a year, offset part of the cost.",
    ],
  },
  {
    id: "right-to-try",
    question: "How is this different from the federal Right to Try law?",
    answer: [
      "The federal Right to Try Act (2018) lets a patient with a life-threatening illness, who has used up approved options and cannot join a trial, ask a maker for a drug that has passed Phase I and is still in development. The maker does not have to agree, may charge only its direct costs, and sends the FDA a yearly summary of doses supplied, patients treated, uses, and serious side effects and their outcomes, but not whether patients improved. The FDA's yearly summaries count only 12 drugs and biologics with Right to Try use reported from May 2018 through 2022, 4 in 2023, 5 in 2024 and 6 in 2025. It does not cover drugs already approved for other conditions.",
      "Under this act, any patient whose doctor recommends a screened treatment and records the reason can get it with written consent, clinics can charge for it, and every result is published.",
    ],
    source: {
      href: "https://www.fda.gov/patients/learn-about-expanded-access-and-other-treatment-options/right-try-annual-reporting-summary",
      label: "FDA, Right to Try annual reporting summary",
    },
  },
  {
    id: "liability",
    question: "Who is liable if something goes wrong?",
    answer: [
      "The bill limits liability under state law for the people who review, provide or give a treatment under the act. The limit does not cover gross negligence, reckless or willful misconduct, intentional harm, fraud, concealing safety information, or a material violation of the act. Makers of the treatments stay liable under ordinary state law. Federal law still applies, and the federal Right to Try law's protections cover only patients who meet its rules.",
    ],
  },
  {
    id: "randomized-trials",
    question: "Does it replace randomized trials?",
    answer: [
      "No. The bill also lets ordinary doctors enroll patients in centrally run randomized trials, as RECOVERY did, alongside treatments an independent board has screened.",
    ],
  },
  {
    id: "exploitation",
    question: "Could clinics exploit patients by charging for experimental treatment?",
    answer: [
      "Unproven stem-cell clinics show why people worry about this. The act answers it four ways. The board approves each protocol and each clinic that offers it. The consent form says the treatment is experimental and that insurance does not have to pay. An unresolved serious safety problem stops new patients. Every result, including failures, is published, so a clinic cannot hide poor results.",
    ],
  },
]
