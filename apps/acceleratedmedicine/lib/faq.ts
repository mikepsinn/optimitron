import { ACT_QUESTIONS, type ActQuestion } from "@/lib/act-questions"

// The FAQ's answers come from the act page, the deck's speaker notes (content/patient-journey/script.md),
// the earlier FAQ and the questions-and-answers page in Notion (answers marked ready for the site). Questions about the act are the act page's own, so the two pages cannot disagree.
export type FaqLink = { href: string; label: string }
export type FaqQuestion = { id: string; question: string; answer: string[]; link?: FaqLink; source?: FaqLink }
export type FaqSection = { id: string; title: string; questions: FaqQuestion[] }

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
        id: "existing-trials",
        question: "Why not just use existing clinical trials?",
        answer: [
          "Most patients cannot join one, because eligibility rules exclude them or the nearest site is too far away. Repurposed generic drugs rarely get trials at all, because no company can recover the cost. One ten-year review found 573 existing drugs that researchers had proposed as Alzheimer's treatments.",
        ],
        source: { href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10512468/", label: "PubMed Central, PMC10512468" },
      },
      {
        id: "randomized",
        question: "Are the trials randomized?",
        answer: [
          "Most patients choose a screened treatment with their doctor, and their outcomes are recorded and pooled. That shows patterns quickly, but on its own it does not prove that a treatment caused the result.",
          "Patients can also choose to join centrally run comparisons, as RECOVERY did. The trial, not the doctor, assigns each patient's treatment, at random or by another scientifically justified method. The approved protocol sets what is compared and whether a placebo is used. Every published result says which method produced it.",
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
          "An independent review board of at least five members: a physician, an outcomes researcher, an ethicist, a non-scientist and a member unaffiliated with the clinics and makers it reviews. None may have financial ties to the clinic or the maker. The board also approves each clinic and consent form.",
        ],
      },
      {
        id: "side-effects",
        question: "What happens if something goes wrong?",
        answer: [
          "The clinic must report serious side effects to the review board and the state health department within five days. If a serious safety problem is unresolved, the board must stop treating new patients until it is resolved. A current patient can continue only if their doctor and the board decide that stopping suddenly is riskier. Every protocol is reviewed at least once a year.",
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
    questions: [
      {
        id: "who-qualifies",
        question: "Who can get treatment under the act?",
        answer: [
          "Any patient whose doctor recommends a screened treatment and records the clinical reason in the medical record, with written informed consent. A patient does not need a life-threatening illness, to be unable to join a trial, or to have used up approved options first.",
        ],
      },
      {
        id: "which-treatments",
        question: "Which treatments qualify?",
        answer: [
          "A treatment qualifies in one of four ways. It has passed Phase I or comparable early testing in people. It has a documented record of safe use in people, including evidence gathered under regulators on the World Health Organization's published list. It is built on a well-understood biological method, such as a genetic treatment made for one patient, with supporting lab or animal data and a safety review every six months or every ten patients. Or, for a device, it has been studied under FDA device rules, is judged not significant-risk, or is authorized by a qualifying regulator.",
          "Schedule I drugs never qualify.",
        ],
      },
      actQuestion("who-pays"),
      {
        id: "insurance",
        question: "Does the act change a patient's regular insurance coverage?",
        answer: [
          "No. Insurers do not have to cover experimental treatment under the act, and coverage mandates and network rules do not apply to it. Coverage for everything else stays the same, and insurers may choose to pay.",
        ],
      },
      actQuestion("right-to-try"),
      actQuestion("liability"),
      actQuestion("exploitation"),
    ],
  },
  {
    id: "doctors",
    title: "Doctors and clinics",
    questions: [
      {
        id: "small-practice",
        question: "What does this cost a small practice?",
        answer: [
          "Taking part is optional. A practice can show competence with a statement from its medical director. The outcome record uses what is already in the chart: boards must accept medical records, and no one may require duplicate entry. The practice can let its electronic health record, a central sponsor or a contractor submit for it.",
          "A trial's approved protocol may pay practices for consent, treatment, follow-up and data submission.",
        ],
        link: { href: "/contact?type=clinic", label: "Partner with us" },
      },
      {
        id: "discipline",
        question: "Does the act stop the medical board from disciplining bad doctors?",
        answer: [
          "No. The state keeps its authority over gross negligence, incompetence, exploitation, fraud, concealment and practice outside lawful scope. It cannot discipline a doctor merely for recommending or giving a treatment the act permits.",
        ],
      },
    ],
  },
]
