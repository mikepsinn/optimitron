import { ACT_QUESTIONS, type ActQuestion } from "@/lib/act-questions"

// The FAQ's answers come from the act page, the deck's speaker notes (content/patient-journey/script.md)
// and the earlier FAQ. Questions about the act are the act page's own, so the two pages cannot disagree.
export type FaqLink = { href: string; label: string }
export type FaqQuestion = { id: string; question: string; answer: string[]; link?: FaqLink }
// A section can end with a source note: its text, then a link.
export type FaqSection = { id: string; title: string; questions: FaqQuestion[]; source?: FaqLink & { text: string } }

const actQuestion = (id: ActQuestion["id"]): FaqQuestion => {
  const found = ACT_QUESTIONS.find(question => question.id === id)
  if (!found) throw new Error(`No act question ${id}`)
  return found
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "trials",
    title: "Care-integrated clinical trials",
    questions: [
      {
        id: "what",
        question: "What is a care-integrated clinical trial?",
        answer: [
          "A clinical trial built into ordinary medical care. A patient gets a screened treatment through their own doctor, and their outcome is recorded from routine medical records and pooled with every other clinic's.",
          "The UK's RECOVERY trial worked this way in hospitals during COVID-19. In 89 days it showed that dexamethasone, a cheap steroid, cut deaths among the sickest patients by up to a third.",
        ],
      },
      {
        id: "randomized",
        question: "Are the trials randomized?",
        answer: [
          "Most patients choose a screened treatment with their doctor, and their outcomes are recorded and pooled. That shows patterns quickly, but on its own it does not prove that a treatment caused the result.",
          "Patients can also choose to join centrally run randomized comparisons, as RECOVERY did. The trial, not the doctor, assigns each patient a treatment at random. There is no placebo arm. Every published result says which method produced it.",
        ],
      },
      {
        id: "cost",
        question: "Why do they cost less?",
        answer: [
          "They use existing clinics and routine records instead of building a separate research site for each study. RECOVERY cost about $500 per patient, compared with about $41,000 per patient in the trials behind new FDA approvals (Manhattan Institute, 2023; Moore et al., JAMA Internal Medicine, 2018).",
        ],
      },
      {
        id: "advice",
        question: "Does the initiative tell patients which treatment to choose?",
        answer: [
          "No. Treatment decisions belong to patients and their doctors. We explain the evidence and the research methods, and give no medical advice.",
        ],
      },
      {
        id: "help",
        question: "How can I help?",
        answer: [
          "Add your name, or endorse the initiative as an organization. Clinics, researchers, data partners and funders can also partner with us.",
        ],
        link: { href: "/support", label: "Show your support" },
      },
    ],
  },
  {
    id: "safety",
    title: "Safety and data",
    questions: [
      {
        id: "screening",
        question: "Who decides a treatment is safe enough to offer?",
        answer: [
          "An independent review board of at least five members: a physician, an outcomes researcher, an ethicist, a non-scientist and a member unaffiliated with the clinics and makers it reviews. None may have financial ties to the clinic or the maker. A treatment qualifies through early safety testing in people, a documented record of safe use in people, a well-understood biological method with supporting lab or animal data, or evidence specific to a device. The board also approves each clinic and consent form.",
        ],
      },
      {
        id: "side-effects",
        question: "What happens if something goes wrong?",
        answer: [
          "Serious side effects reach the board within days, and the board can pause new patients until the problem is resolved. Current patients can continue if stopping would be riskier. Every protocol is reviewed at least once a year.",
        ],
      },
      {
        id: "bad-results",
        question: "Are bad results published?",
        answer: [
          "Yes. Each board publishes a yearly report for each protocol, including results that were bad, null or unclear. Boards may not leave them out.",
        ],
      },
      {
        id: "data",
        question: "What happens to patients' data?",
        answer: [
          "Medical records stay with the patient's clinic. Outcome reports carry a coded ID, not a name, and are published only de-identified. Small groups are combined so no one can be identified.",
        ],
      },
    ],
  },
  {
    id: "act",
    title: "The act",
    questions: [actQuestion("who-pays"), actQuestion("right-to-try"), actQuestion("liability"), actQuestion("exploitation")],
    source: {
      text: "The Right to Try figures come from the FDA's summary, as reported by",
      href: "https://www.factcheck.org/2026/06/no-evidence-for-trumps-right-to-try-claim/",
      label: "FactCheck.org (2026)",
    },
  },
]
