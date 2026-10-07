// Common questions about the act, from the deck's speaker notes (content/patient-journey/script.md). The act
// page shows all of them, and the FAQ reuses them, so the answers live in one place.
export type ActQuestion = { id: string; question: string; answer: string[] }

export const ACT_QUESTIONS: ActQuestion[] = [
  {
    id: "who-pays",
    question: "Who pays, and what does it cost the state?",
    answer: [
      "No insurer or state program has to pay. The patient, family, charities, employers, research sponsors, and insurers that choose to can pay.",
      "Clinics may charge for treatment, so they have a reason to offer new treatments, and one board approval can cover many clinics. Other ways to pay include installments or memberships, crowdfunding, patient-aid groups, free supply from the maker, and lower prices for patients who share outcome data.",
    ],
  },
  {
    id: "right-to-try",
    question: "How is this different from the federal Right to Try law?",
    answer: [
      "The federal Right to Try Act (2018) lets a patient with a life-threatening illness, who has used up approved options and cannot join a trial, ask a maker for a drug that has passed Phase I and is still in development. The maker does not have to agree, may charge only its direct costs, and sends the FDA a yearly summary of doses supplied, patients treated, uses, and serious side effects and their outcomes, but not whether patients improved. The FDA reports only 21 investigational drugs used under the law from May 2018 to December 2024. It does not cover drugs already approved for other conditions.",
      "Under this act, any patient whose doctor recommends a screened treatment and records the reason can get it with written consent, clinics can charge for it, and every result is published.",
    ],
  },
  {
    id: "liability",
    question: "Who is liable if something goes wrong?",
    answer: [
      "The bill protects doctors, clinics and review boards that take part in good faith from liability under state law, except for gross negligence, reckless or willful misconduct, fraud, or concealing safety information. Makers of the treatments stay liable under ordinary state law. Federal law still applies, and the federal Right to Try law's protections cover only patients who meet its rules.",
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
      "Unproven stem-cell clinics show why people worry about this. The act answers it four ways. The board approves each clinic and protocol. The consent form states the cost and that the treatment is experimental. Serious side effects can pause new patients. Every result, including failures, is published, so a clinic cannot hide poor results.",
    ],
  },
]
