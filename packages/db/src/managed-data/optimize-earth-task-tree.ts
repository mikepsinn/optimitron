import {
  DEFENSE_LOBBYING_ANNUAL,
  DEFENSE_TAKEOVER_COST_PER_HUMAN,
  MECHANISM_COURT_OF_HUMANITY_P_SUCCESS,
  MECHANISM_DFDA_P_SUCCESS,
  MECHANISM_LOVING_TAKEOVER_P_SUCCESS,
  MECHANISM_REFERENDUM_P_SUCCESS,
  MECHANISM_SHIRT_CASCADE_P_SUCCESS,
  MECHANISM_TREATY_CAMPAIGN_P_SUCCESS,
  PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT,
} from "@optimitron/data/parameters";
import { TaskCategory, TaskClaimPolicy } from "../generated/prisma/client.js";
import {
  EARTH_OPTIMIZATION_PRIZE_TASK_ID,
  EARTH_OPTIMIZATION_PRIZE_TASK_KEY,
  EOS_APPROVE_FINANCING_PACKET_TASK_ID,
  EOS_APPROVE_FINANCING_PACKET_TASK_KEY,
  EOS_CAPITALIZE_TASK_ID,
  EOS_CAPITALIZE_TASK_KEY,
  EOS_FUND_WORK_PACKAGES_TASK_ID,
  EOS_FUND_WORK_PACKAGES_TASK_KEY,
  EOS_ISSUE_CONTRIBUTION_RECEIPTS_TASK_ID,
  EOS_ISSUE_CONTRIBUTION_RECEIPTS_TASK_KEY,
  EOS_OPEN_FINANCING_ROUND_TASK_ID,
  EOS_OPEN_FINANCING_ROUND_TASK_KEY,
  EOS_RECRUIT_INDEPENDENT_REVIEWERS_TASK_ID,
  EOS_RECRUIT_INDEPENDENT_REVIEWERS_TASK_KEY,
  EOS_REVIEW_CORPORATE_AUTHORITY_TASK_ID,
  EOS_REVIEW_CORPORATE_AUTHORITY_TASK_KEY,
  EOS_REVIEW_FINANCING_TERMS_TASK_ID,
  EOS_REVIEW_FINANCING_TERMS_TASK_KEY,
  EOS_REVIEW_SECURITIES_EXEMPTIONS_TASK_ID,
  EOS_REVIEW_SECURITIES_EXEMPTIONS_TASK_KEY,
  EOS_REVIEW_SUBSCRIPTION_AGREEMENT_TASK_ID,
  EOS_REVIEW_SUBSCRIPTION_AGREEMENT_TASK_KEY,
  EOS_REVIEW_USE_OF_PROCEEDS_TASK_ID,
  EOS_REVIEW_USE_OF_PROCEEDS_TASK_KEY,
  EOS_VERIFY_ENTITY_TASK_ID,
  EOS_VERIFY_ENTITY_TASK_KEY,
  LOVING_TAKEOVER_LOVE_LETTER_TASK_ID,
  LOVING_TAKEOVER_LOVE_LETTER_TASK_KEY,
  LOVING_TAKEOVER_OWN_ONE_SHARE_TASK_ID,
  LOVING_TAKEOVER_OWN_ONE_SHARE_TASK_KEY,
  LOVING_TAKEOVER_OPTIMIZE_LOBBYING_TASK_ID,
  LOVING_TAKEOVER_OPTIMIZE_LOBBYING_TASK_KEY,
  LOVING_TAKEOVER_TASK_ID,
  LOVING_TAKEOVER_TASK_KEY,
} from "../task-keys.js";
import {
  COURT_OF_HUMANITY_CHARTER_TASK_ID,
  COURT_OF_HUMANITY_CHARTER_TASK_KEY,
  COURT_OF_HUMANITY_TASK_ID,
  COURT_OF_HUMANITY_TASK_KEY,
  DFDA_CREATE_TASK_ID,
  DFDA_CREATE_TASK_KEY,
  END_WAR_AND_DISEASE_TASK_ID,
  END_WAR_AND_DISEASE_TASK_KEY,
  ENFORCE_ONE_PERCENT_TREATY_SETTLEMENT_TASK_ID,
  ENFORCE_ONE_PERCENT_TREATY_SETTLEMENT_TASK_KEY,
  HUMANITY_V_GOVERNMENT_CASE_NAME,
  HUMANITY_V_GOVERNMENTS_TASK_ID,
  HUMANITY_V_GOVERNMENTS_TASK_KEY,
  ONE_PERCENT_TREATY_HEADS_OF_GOVERNMENT_TASK_ID,
  ONE_PERCENT_TREATY_HEADS_OF_GOVERNMENT_TASK_KEY,
  ONE_PERCENT_TREATY_MAJORITY_VOTE_TASK_ID,
  ONE_PERCENT_TREATY_MAJORITY_VOTE_TASK_KEY,
  OPTIMITRON_DEV_TASK_ID,
  OPTIMITRON_DEV_TASK_KEY,
  OPTIMIZE_EARTH_ROOT_TASK_ID,
  OPTIMIZE_EARTH_ROOT_TASK_KEY,
  PUBLISH_EVIDENCE_AND_DAMAGES_TASK_ID,
  PUBLISH_EVIDENCE_AND_DAMAGES_TASK_KEY,
  REGISTER_PLAINTIFFS_TASK_ID,
  REGISTER_PLAINTIFFS_TASK_KEY,
  RENDER_VERDICT_TASK_ID,
  RENDER_VERDICT_TASK_KEY,
  SHIRT_SEED_TASK_ID,
  SHIRT_SEED_TASK_KEY,
  SUMMON_JURORS_TASK_ID,
  SUMMON_JURORS_TASK_KEY,
  TREATY_PARENT_TASK_ID,
  TREATY_PARENT_TASK_KEY,
  TREATY_PARENT_TASK_TITLE,
} from "../task-keys.js";
import type { ManagedTaskRecord } from "./sync-managed-tasks.js";

export const OPTIMIZE_EARTH_TASK_TREE_COLLECTION_KEY =
  "optimize-earth-task-tree";

const defaultTaskFields = {
  category: TaskCategory.ORGANIZING,
  claimPolicy: TaskClaimPolicy.OPEN_MANY,
  isPublic: true,
  skillTags: ["coordination"],
  interestTags: ["war-on-disease", "one-percent-treaty"],
} satisfies Partial<ManagedTaskRecord>;

export const OPTIMIZE_EARTH_TASK_TREE: ManagedTaskRecord[] = [
  {
    ...defaultTaskFields,
    id: OPTIMIZE_EARTH_ROOT_TASK_ID,
    taskKey: OPTIMIZE_EARTH_ROOT_TASK_KEY,
    parentTaskId: null,
    title: "Optimize Earth",
    description: [
      "The root task for civilization: increase median healthy life years and median after-tax income by forcing public resources toward welfare-maximizing work.",
      "",
      "Current cost of delay: humanity is losing about $101 trillion per year to the [Political Dysfunction Tax](https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html) — the gap between realized welfare and what a non-dysfunctional government would produce. That is the burn rate every child task below this one is fighting against.",
      "",
      "The current bottleneck is ending war and disease. Everything below this task should either help humans vote, recruit two more humans, register plaintiffs, summon jurors, remind leaders, or make the 1% Treaty credible enough to pass.",
    ].join("\n"),
    impactStatement:
      "Every task below exists to move humanity from delay to welfare.",
    // Overdue — `getTaskDelayStats` multiplies the per-day delay rates by
    // `currentDelayDays`, which is zero when `dueAt` is null. Without this the
    // root row shows $0 wasted / 0 deaths-from-delay even though the per-day
    // rates are wired correctly. 2024-12-31 is "civilization should have been
    // optimized by now"; child program tasks below set their own dueAt where
    // an explicit deadline is appropriate.
    dueAt: new Date("2024-12-31T00:00:00.000Z"),
    sortOrder: -1000,
    primaryEndpoint: {
      label: "Open the Optimize Earth task tree",
      url: "/tasks/optimize-earth",
      instructions:
        "Open the root task and choose the highest-leverage child task you can complete.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.LEGAL,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    id: EOS_VERIFY_ENTITY_TASK_ID,
    taskKey: EOS_VERIFY_ENTITY_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Verify the EOS legal entity and records",
    description:
      "Confirm the entity name, jurisdiction, standing, ownership, and authority from signed or filed records. Attach authoritative records before anyone reviews drafts or raises money.",
    impactStatement:
      "Investors and reviewers need verified facts, not a legal identity assembled from old website copy.",
    skillTags: ["corporate-law", "corporate-records", "due-diligence"],
    requiredCredentialTags: ["licensed-attorney"],
    sortOrder: -609,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.OUTREACH,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    blockedByTaskKeys: [EOS_VERIFY_ENTITY_TASK_KEY],
    id: EOS_RECRUIT_INDEPENDENT_REVIEWERS_TASK_ID,
    taskKey: EOS_RECRUIT_INDEPENDENT_REVIEWERS_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Recruit independent financing reviewers",
    description:
      "Find qualified lawyers and finance experts for the verified entity and jurisdiction. Record credential sources and conflicts, then request human approval before contacting anyone.",
    impactStatement:
      "Independent review is useful only when the reviewers are qualified, conflict-checked, and reviewing the right entity.",
    skillTags: ["expert-research", "legal-recruiting", "due-diligence"],
    sortOrder: -608,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.LEGAL,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    blockedByTaskKeys: [
      EOS_VERIFY_ENTITY_TASK_KEY,
      EOS_RECRUIT_INDEPENDENT_REVIEWERS_TASK_KEY,
    ],
    id: EOS_REVIEW_CORPORATE_AUTHORITY_TASK_ID,
    taskKey: EOS_REVIEW_CORPORATE_AUTHORITY_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Review EOS corporate authority and governance",
    description:
      "Review the exact governing-document revisions and identify the approvals, signatures, filings, and conflicts that must be resolved before EOS accepts financing.",
    impactStatement:
      "Money should not arrive before the entity has authority to accept it and use it as promised.",
    skillTags: ["corporate-law", "corporate-governance"],
    requiredCredentialTags: ["licensed-attorney"],
    sortOrder: -607,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.LEGAL,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    blockedByTaskKeys: [
      EOS_VERIFY_ENTITY_TASK_KEY,
      EOS_RECRUIT_INDEPENDENT_REVIEWERS_TASK_KEY,
    ],
    id: EOS_REVIEW_FINANCING_TERMS_TASK_ID,
    taskKey: EOS_REVIEW_FINANCING_TERMS_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Review EOS financing terms",
    description:
      "Review the exact financing terms for economics, control, dilution, investor rights, restrictions, and conflicts with the verified governing records.",
    impactStatement:
      "Clear terms let contributors understand what they receive and what EOS may do with their money.",
    skillTags: ["corporate-finance", "venture-financing"],
    requiredCredentialTags: ["licensed-attorney"],
    sortOrder: -606,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.LEGAL,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    blockedByTaskKeys: [
      EOS_VERIFY_ENTITY_TASK_KEY,
      EOS_RECRUIT_INDEPENDENT_REVIEWERS_TASK_KEY,
    ],
    id: EOS_REVIEW_SUBSCRIPTION_AGREEMENT_TASK_ID,
    taskKey: EOS_REVIEW_SUBSCRIPTION_AGREEMENT_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Review the EOS subscription agreement",
    description:
      "Review the exact agreement contributors will sign, including representations, disclosures, payment terms, remedies, privacy, and links to the adopted financing terms.",
    impactStatement:
      "The signed agreement should match the offer people were shown and the records EOS adopted.",
    skillTags: ["contract-review", "venture-financing"],
    requiredCredentialTags: ["licensed-attorney"],
    sortOrder: -605,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.LEGAL,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    blockedByTaskKeys: [
      EOS_VERIFY_ENTITY_TASK_KEY,
      EOS_RECRUIT_INDEPENDENT_REVIEWERS_TASK_KEY,
    ],
    id: EOS_REVIEW_SECURITIES_EXEMPTIONS_TASK_ID,
    taskKey: EOS_REVIEW_SECURITIES_EXEMPTIONS_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Review securities exemptions and investor eligibility",
    description:
      "Determine which offering rules apply, who may participate, what disclosures and filings are required, and which jurisdictions must remain excluded.",
    impactStatement:
      "A financing round is not ready until EOS knows whom it may legally accept money from and under which rules.",
    skillTags: ["securities-law", "regulatory-compliance"],
    requiredCredentialTags: ["licensed-attorney"],
    sortOrder: -604,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.GOVERNANCE,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    blockedByTaskKeys: [
      EOS_VERIFY_ENTITY_TASK_KEY,
      EOS_RECRUIT_INDEPENDENT_REVIEWERS_TASK_KEY,
    ],
    id: EOS_REVIEW_USE_OF_PROCEEDS_TASK_ID,
    taskKey: EOS_REVIEW_USE_OF_PROCEEDS_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Review EOS use of proceeds and impact allocation",
    description:
      "Turn each promised use of proceeds into a separately fundable task with adopted terms, a pinned impact estimate, spending authority, and outcome reporting.",
    impactStatement:
      "Contributors should be able to trace money from the financing terms to concrete work and later evidence.",
    skillTags: ["impact-accounting", "budget-review", "corporate-governance"],
    sortOrder: -603,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.GOVERNANCE,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    blockedByTaskKeys: [
      EOS_REVIEW_CORPORATE_AUTHORITY_TASK_KEY,
      EOS_REVIEW_FINANCING_TERMS_TASK_KEY,
      EOS_REVIEW_SUBSCRIPTION_AGREEMENT_TASK_KEY,
      EOS_REVIEW_SECURITIES_EXEMPTIONS_TASK_KEY,
      EOS_REVIEW_USE_OF_PROCEEDS_TASK_KEY,
    ],
    id: EOS_APPROVE_FINANCING_PACKET_TASK_ID,
    taskKey: EOS_APPROVE_FINANCING_PACKET_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Approve the EOS financing packet",
    description:
      "Adopt one exact, internally consistent set of financing documents after required reviews are accepted. Record any reviewer waiver and its reason in the permanent decision artifact.",
    contextJson: {
      requiresDocumentDecision: {
        schema: "optimitron.requires-document-decision.v1",
      },
    },
    impactStatement:
      "One adopted packet prevents investors, operators, and payment systems from acting on different drafts.",
    skillTags: ["corporate-governance", "document-review"],
    sortOrder: -602,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.GOVERNANCE,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    blockedByTaskKeys: [EOS_APPROVE_FINANCING_PACKET_TASK_KEY],
    id: EOS_OPEN_FINANCING_ROUND_TASK_ID,
    taskKey: EOS_OPEN_FINANCING_ROUND_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Open the EOS financing round",
    description:
      "Open contributions only after the adopted packet, eligibility rules, payment flow, and exact public offer have passed their approval gates.",
    impactStatement:
      "The fastest safe financing round is one that does not need to unwind avoidable legal or disclosure mistakes.",
    skillTags: ["fundraising", "financing-operations"],
    sortOrder: -601,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.ORGANIZING,
    blockedByTaskKeys: [EOS_OPEN_FINANCING_ROUND_TASK_KEY],
    id: EOS_FUND_WORK_PACKAGES_TASK_ID,
    taskKey: EOS_FUND_WORK_PACKAGES_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Fund concrete EOS work packages",
    description:
      "Let contributors fund separately scoped tasks with their own target, adopted governing revisions, expected costs, and pinned impact estimate.",
    impactStatement:
      "Specific work packages make the use of money inspectable and let higher-impact work earn priority.",
    skillTags: ["fundraising", "program-management", "impact-accounting"],
    sortOrder: -600,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.GOVERNANCE,
    blockedByTaskKeys: [EOS_OPEN_FINANCING_ROUND_TASK_KEY],
    id: EOS_ISSUE_CONTRIBUTION_RECEIPTS_TASK_ID,
    taskKey: EOS_ISSUE_CONTRIBUTION_RECEIPTS_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Issue contribution receipts and outcome addenda",
    description:
      "For every successful payment, preserve the amount, intended task, adopted terms, document hashes, and impact-estimate version. Append later completion, refund, correction, and outcome evidence without rewriting the original receipt.",
    impactStatement:
      "A contributor should be able to see exactly what was promised, what happened later, and what remains only an estimate.",
    skillTags: ["audit-trail", "impact-accounting", "payment-operations"],
    sortOrder: -599,
  },
  {
    ...defaultTaskFields,
    id: END_WAR_AND_DISEASE_TASK_ID,
    taskKey: END_WAR_AND_DISEASE_TASK_KEY,
    parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
    title: "End War and Disease",
    description: [
      "Run the international campaign to end war on disease.",
      "",
      `The practical route is to build the Court of Humanity, prosecute ${HUMANITY_V_GOVERNMENT_CASE_NAME}, and ratify the 1% Treaty so one percent of military spending funds pragmatic clinical trials instead of organized murder machinery.`,
    ].join("\n"),
    impactStatement:
      "This is the public mission under Optimize Earth until the 1% Treaty passes.",
    sortOrder: -900,
    primaryEndpoint: {
      label: "Open warondisease.org",
      url: "/",
      instructions:
        "Vote, share, recruit two more humans, or choose a campaign task.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.LEGAL,
    id: COURT_OF_HUMANITY_TASK_ID,
    taskKey: COURT_OF_HUMANITY_TASK_KEY,
    parentTaskId: END_WAR_AND_DISEASE_TASK_ID,
    title: "Establish the Court of Humanity",
    description: [
      "Make the Court of Humanity legible as the institution where humans can judge governments that spend public resources against the general welfare.",
      "",
      "The court exists to prosecute failures to promote welfare, record verdicts, and enforce settlements that redirect resources away from killing and toward health and wealth.",
    ].join("\n"),
    impactStatement:
      "A majority jury needs a court-shaped place to render the verdict.",
    // Wishonia's Wager: conditional value = annual peace dividend; probability = P(treaty | court funded).
    // The sync multiplies these into the frame's expected value; the donation cost lives on the funding target.
    expectedEconomicValueUsdBase: PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT.value,
    successProbabilityBase: MECHANISM_COURT_OF_HUMANITY_P_SUCCESS.value,
    sortOrder: -800,
    primaryEndpoint: {
      label: "Open the Court of Humanity",
      url: "/court",
      instructions:
        "Read the Court surface and complete the next institution-building task.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.LEGAL,
    id: COURT_OF_HUMANITY_CHARTER_TASK_ID,
    taskKey: COURT_OF_HUMANITY_CHARTER_TASK_KEY,
    parentTaskId: COURT_OF_HUMANITY_TASK_ID,
    title: "Adopt the Court of Humanity charter",
    description:
      "Publish the court charter, rules, jurisdiction, evidence standards, and verdict mechanics in language normal humans can understand.",
    impactStatement: "The court needs rules before the verdict has weight.",
    sortOrder: -790,
    primaryEndpoint: {
      label: "Open the Court charter surface",
      url: "/court",
      instructions:
        "Help turn the Court of Humanity into a clear public institution.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.LEGAL,
    id: HUMANITY_V_GOVERNMENTS_TASK_ID,
    taskKey: HUMANITY_V_GOVERNMENTS_TASK_KEY,
    parentTaskId: COURT_OF_HUMANITY_TASK_ID,
    title: `Prosecute ${HUMANITY_V_GOVERNMENT_CASE_NAME}`,
    description: [
      "Frame the case that governments were hired and funded to promote the general welfare, then used trillions to murder citizens and delay disease eradication.",
      "",
      "The desired settlement is the 1% Treaty.",
    ].join("\n"),
    impactStatement:
      "Turn the campaign into a public case with plaintiffs, jurors, evidence, verdict, and settlement.",
    sortOrder: -780,
    primaryEndpoint: {
      label: `Open ${HUMANITY_V_GOVERNMENT_CASE_NAME}`,
      url: "/humanity-v-government",
      instructions:
        "Review the case and complete the highest-leverage prosecution task.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.LEGAL,
    id: REGISTER_PLAINTIFFS_TASK_ID,
    taskKey: REGISTER_PLAINTIFFS_TASK_KEY,
    parentTaskId: HUMANITY_V_GOVERNMENTS_TASK_ID,
    title: "Register plaintiffs",
    description:
      "Register people harmed by war, disease, and delayed welfare optimization, including people who cannot sign for themselves.",
    impactStatement:
      "The case needs named humans, not abstract humanity-flavored vapor.",
    sortOrder: -770,
    primaryEndpoint: {
      label: "Register a plaintiff",
      url: "/plaintiffs",
      instructions: `Register a plaintiff in ${HUMANITY_V_GOVERNMENT_CASE_NAME}.`,
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.OUTREACH,
    id: SUMMON_JURORS_TASK_ID,
    taskKey: SUMMON_JURORS_TASK_KEY,
    parentTaskId: HUMANITY_V_GOVERNMENTS_TASK_ID,
    title: "Summon jurors",
    description: `Invite humans to act as jurors by voting on the verdict in ${HUMANITY_V_GOVERNMENT_CASE_NAME}.`,
    impactStatement:
      "A court for humanity needs a jury large enough to matter.",
    sortOrder: -760,
    primaryEndpoint: {
      label: "Open the referral dashboard",
      url: "/dashboard",
      instructions: "Invite at least two humans to vote on the case.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.RESEARCH,
    id: PUBLISH_EVIDENCE_AND_DAMAGES_TASK_ID,
    taskKey: PUBLISH_EVIDENCE_AND_DAMAGES_TASK_KEY,
    parentTaskId: HUMANITY_V_GOVERNMENTS_TASK_ID,
    title: "Publish evidence and damages",
    description:
      "Publish the evidence package, damages model, citations, and economic harm calculations for the case.",
    impactStatement:
      "People share cases that name the harm and show the receipts.",
    sortOrder: -750,
    primaryEndpoint: {
      label: "Open the case evidence",
      url: "/humanity-v-government",
      instructions:
        "Review the case evidence and improve any weak claim before people share it.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.LEGAL,
    id: RENDER_VERDICT_TASK_ID,
    taskKey: RENDER_VERDICT_TASK_KEY,
    parentTaskId: HUMANITY_V_GOVERNMENTS_TASK_ID,
    title: "Render the verdict",
    description:
      "Get a majority of humanity to render a verdict on whether governments are liable for using public resources against the general welfare.",
    impactStatement:
      "The verdict becomes politically real when enough humans say it is real.",
    sortOrder: -740,
    primaryEndpoint: {
      label: "Render your verdict",
      url: "/humanity-v-government",
      instructions:
        "Vote on the case and invite two more humans to do the same.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.GOVERNANCE,
    id: ENFORCE_ONE_PERCENT_TREATY_SETTLEMENT_TASK_ID,
    taskKey: ENFORCE_ONE_PERCENT_TREATY_SETTLEMENT_TASK_KEY,
    parentTaskId: HUMANITY_V_GOVERNMENTS_TASK_ID,
    title: "Enforce the settlement: the 1% Treaty",
    description:
      "Use the verdict to make the settlement unavoidable: redirect one percent of military spending into pragmatic clinical trials and disease eradication.",
    impactStatement:
      "The case matters if it produces the settlement that ends the delay.",
    sortOrder: -730,
    primaryEndpoint: {
      label: "Sign the 1% Treaty",
      url: "/vote",
      instructions:
        "Sign the 1% Treaty and help make the settlement politically unavoidable.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.GOVERNANCE,
    id: TREATY_PARENT_TASK_ID,
    taskKey: TREATY_PARENT_TASK_KEY,
    parentTaskId: END_WAR_AND_DISEASE_TASK_ID,
    title: TREATY_PARENT_TASK_TITLE,
    description:
      "Ratify the treaty that redirects one percent of military spending into pragmatic clinical trials and disease eradication.",
    impactStatement:
      "The fastest known settlement is one percent of the war budget pointed at disease.",
    // Wishonia's Wager: conditional value = annual peace dividend; probability = P(treaty | campaign funded).
    expectedEconomicValueUsdBase: PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT.value,
    successProbabilityBase: MECHANISM_TREATY_CAMPAIGN_P_SUCCESS.value,
    // Keep the cost-of-delay counters on `/employees` and similar treaty
    // surfaces live by preserving an overdue `dueAt`. The managed-sync
    // overwrites whatever the seed wrote, so we have to set it here too.
    dueAt: new Date("2024-12-31T00:00:00.000Z"),
    sortOrder: -700,
    primaryEndpoint: {
      label: "Sign the 1% Treaty",
      url: "/vote",
      instructions:
        "Sign the treaty, share it, and then remind the leaders who still have not signed.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.OUTREACH,
    id: ONE_PERCENT_TREATY_MAJORITY_VOTE_TASK_ID,
    taskKey: ONE_PERCENT_TREATY_MAJORITY_VOTE_TASK_KEY,
    parentTaskId: TREATY_PARENT_TASK_ID,
    title: "Get a majority of humanity to vote yes",
    description:
      "Reach a verified majority of humanity by asking every signer to recruit at least two more humans.",
    impactStatement:
      "Thirty-two doubling rounds with two referrals each reaches a majority of humanity.",
    sortOrder: -690,
    primaryEndpoint: {
      label: "Vote and share",
      url: "/vote",
      instructions:
        "Vote yes, then recruit two more humans so the doubling chain continues.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.GOVERNANCE,
    id: ONE_PERCENT_TREATY_HEADS_OF_GOVERNMENT_TASK_ID,
    taskKey: ONE_PERCENT_TREATY_HEADS_OF_GOVERNMENT_TASK_KEY,
    parentTaskId: TREATY_PARENT_TASK_ID,
    title: "Get 193 heads of government to sign",
    description:
      "Remind every head of government to sign the 1% Treaty. One signature. One pen. Thirty seconds.",
    impactStatement:
      "The government-side task is not vague adoption. It is 193 named humans signing.",
    sortOrder: -680,
    primaryEndpoint: {
      label: "Manage presidents",
      url: "/employees",
      instructions:
        "Pick an overdue head of government and send them a reminder.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.ORGANIZING,
    id: LOVING_TAKEOVER_TASK_ID,
    taskKey: LOVING_TAKEOVER_TASK_KEY,
    parentTaskId: END_WAR_AND_DISEASE_TASK_ID,
    title: "The Loving Takeover",
    description: [
      "Buy the companies whose lobbying keeps war funded, and have that lobbying allocated by analysis instead of habit — pointed at whatever maximizes long-term shareholder value, starting with the shareholders staying alive. Every run of the math says that is the 1% Treaty.",
      "",
      `Control of every major military contractor costs about $${Math.round(DEFENSE_TAKEOVER_COST_PER_HUMAN.value)} per human. The people bought out end up richer and longer-lived. That is why it is loving.`,
      "",
      "Start with one share and a love letter. Buy enough shares and you choose the board. Math: [The Loving Takeover](https://manual.warondisease.org/knowledge/appendix/loving-takeover.html).",
    ].join("\n"),
    impactStatement:
      "The best lobbyists money can buy currently block the treaty. So we buy them.",
    // Wishonia's Wager: conditional value = annual peace dividend; probability = P(pass | takeover funded).
    expectedEconomicValueUsdBase: PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT.value,
    successProbabilityBase: MECHANISM_LOVING_TAKEOVER_P_SUCCESS.value,
    sortOrder: -660,
    primaryEndpoint: {
      label: "Read the takeover math",
      url: "https://manual.warondisease.org/knowledge/appendix/loving-takeover.html",
      instructions:
        "Read the math, then start with one share and one love letter.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.OTHER,
    id: LOVING_TAKEOVER_OWN_ONE_SHARE_TASK_ID,
    taskKey: LOVING_TAKEOVER_OWN_ONE_SHARE_TASK_KEY,
    parentTaskId: LOVING_TAKEOVER_TASK_ID,
    title: "Take Love's Wager: own one share",
    description: [
      "Buy one share of any major military contractor through any brokerage.",
      "",
      "One share makes you an owner. Owners can write to the board, and the board has to answer. When the stakes are infinite, any finite action is rational: [Love's Wager](https://manual.warondisease.org/knowledge/proof/loves-wager.html).",
    ].join("\n"),
    impactStatement:
      "Every shareholder is a plaintiff the board cannot dismiss as an outsider.",
    estimatedEffortHours: 0.25,
    sortOrder: -650,
    primaryEndpoint: {
      label: "Read Love's Wager",
      url: "https://manual.warondisease.org/knowledge/proof/loves-wager.html",
      instructions: "Read the wager, buy one share, keep the receipt.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.LEGAL,
    id: LOVING_TAKEOVER_LOVE_LETTER_TASK_ID,
    taskKey: LOVING_TAKEOVER_LOVE_LETTER_TASK_KEY,
    parentTaskId: LOVING_TAKEOVER_TASK_ID,
    title: "Send the board a love letter",
    description: [
      "As a shareholder, write to your board: you own them, you love them, and you do not want them to suffer and die from horrible diseases along with the rest of their shareholders. Their lobbying budget can fix that.",
      "",
      "The law calls this a shareholder demand letter, which means the board is required to read the math and answer on the record. We call it checking in on people we care about.",
    ].join("\n"),
    impactStatement:
      "Boards are legally required to read their mail. This mail says: get richer, live longer.",
    estimatedEffortHours: 0.5,
    sortOrder: -640,
    primaryEndpoint: {
      label: "Read the takeover math",
      url: "https://manual.warondisease.org/knowledge/appendix/loving-takeover.html",
      instructions:
        "Confirm you own a share, then send the love letter to the corporate secretary. The law calls it a demand letter; they have to read it either way.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.GOVERNANCE,
    id: LOVING_TAKEOVER_OPTIMIZE_LOBBYING_TASK_ID,
    taskKey: LOVING_TAKEOVER_OPTIMIZE_LOBBYING_TASK_KEY,
    parentTaskId: LOVING_TAKEOVER_TASK_ID,
    title: `Optimize the $${Math.round(DEFENSE_LOBBYING_ANNUAL.value / 1e6)}M lobbying budget`,
    description: [
      `The ask: the ~$${Math.round(DEFENSE_LOBBYING_ANNUAL.value / 1e6)} million per year of military-contractor lobbying gets allocated by the Optimal Policy and Budget Generators to maximize long-term shareholder value — including the shareholders staying alive.`,
      "",
      "We are not asking the board to fund our favorite cause. We are asking them to run the analysis. Every run we have done says the 1% Treaty is the best buy. If their analysis finds something better for their shareholders, they should do that instead. It won't. The offer stands.",
      "",
      "This is what the shares are for.",
    ].join("\n"),
    impactStatement:
      "Lobbying allocated by math instead of habit pays shareholders first and humanity as a side effect.",
    sortOrder: -630,
    primaryEndpoint: {
      label: "Read the takeover math",
      url: "https://manual.warondisease.org/knowledge/appendix/loving-takeover.html",
      instructions:
        "Track board proposals and proxy votes that put the lobbying budget under analysis.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.ORGANIZING,
    id: EARTH_OPTIMIZATION_PRIZE_TASK_ID,
    taskKey: EARTH_OPTIMIZATION_PRIZE_TASK_KEY,
    parentTaskId: END_WAR_AND_DISEASE_TASK_ID,
    title: "Fund the referendum: the Earth Optimization Prize",
    description: [
      "Deposit, earn yield, fund the vote of all humanity.",
      "",
      "If the treaty never passes, you get your principal back about 4.2× larger after 15 years. The downside has been removed; we found humans respond well to that.",
    ].join("\n"),
    impactStatement:
      "The referendum proves demand for the treaty; the prize pays for the referendum without anyone losing money.",
    // Wishonia's Wager: conditional value = annual peace dividend; probability = P(pass | referendum funded).
    // No funding target: the prize is a dominant assurance contract (depositors refunded with yield),
    // so net cost to a funder is ~zero — presented as a zero-downside row, not in the EV/$ ranking.
    expectedEconomicValueUsdBase: PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT.value,
    successProbabilityBase: MECHANISM_REFERENDUM_P_SUCCESS.value,
    sortOrder: -620,
    primaryEndpoint: {
      label: "Open the Earth Optimization Prize",
      url: "/prize",
      instructions: "Read the terms and deposit.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.ORGANIZING,
    id: EOS_CAPITALIZE_TASK_ID,
    taskKey: EOS_CAPITALIZE_TASK_KEY,
    parentTaskId: END_WAR_AND_DISEASE_TASK_ID,
    title: "Capitalize Earth Optimization Services",
    description: [
      "Earth Optimization Services is the company form of the machine. Every human on Earth is already a president; this task funds the operating budget.",
      "",
      "Capital operates the Evidence Engine, the Budget Redirect, the Loving Takeover, and Direct Allocation — the same four products every civilization needs.",
    ].join("\n"),
    impactStatement:
      "The campaign runs on capital; this is where the capital comes from.",
    // TODO(param): add an EOS capitalization EV parameter before claiming a value here.
    sortOrder: -610,
    primaryEndpoint: {
      label: "Open the fund",
      url: "/fund",
      instructions: "Read the terms, then invest or book a call.",
    },
  },
  {
    // Adopted runtime branch: this row was first created via MCP, so its id is
    // the original cuid rather than a slug (the sync rejects a same-key row
    // under a different id). Fields mirror the adopted row — no
    // defaultTaskFields spread: the branch is private, ENGINEERING, untagged.
    // Its children stay runtime-created.
    category: TaskCategory.ENGINEERING,
    claimPolicy: TaskClaimPolicy.OPEN_MANY,
    isPublic: false,
    id: OPTIMITRON_DEV_TASK_ID,
    taskKey: OPTIMITRON_DEV_TASK_KEY,
    parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
    title: "Optimize Optimitron: engineering program",
    description: [
      "Container for Optimitron self-improvement dev tasks (webhook agent-PR pipeline, PWA notifications, task donations, chat UI, comms audit, rendering fixes).",
      "",
      "Children are agent-executable and runtime-created; the optimitron-worker daily routine pulls actionable AI Agent tasks from this branch.",
    ].join("\n"),
    impactStatement:
      "Every improvement to the coordination engine compounds across all programs; this is the machine improving the machine.",
    estimatedEffortHours: 200,
    // TODO(param): add an Optimitron-engineering EV parameter before claiming a
    // value here. Without economics scalars the sync skips impact writes, so
    // the adopted row's runtime estimate set (mcp-direct-v1) stays current.
    contextJson: {
      value: 2000000,
      ev_math: "container placeholder estimates; refine per-child",
      cash_cost: 0,
      p_success: 0.7,
      executor_type: "Self",
      acceptanceCriteria: [
        "All Optimitron self-improvement dev child tasks are reparented under this branch",
        "optimitron-worker daily routine can pull actionable AI Agent tasks from this branch",
      ],
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.RESEARCH,
    id: DFDA_CREATE_TASK_ID,
    taskKey: DFDA_CREATE_TASK_KEY,
    parentTaskId: END_WAR_AND_DISEASE_TASK_ID,
    title: "Fund the decentralized FDA directly",
    description: [
      "Fund the decentralized FDA (dFDA) to run pragmatic, patient-funded trials at a fraction of the usual cost — the direct path to disease eradication that does not wait on any treaty passing.",
      "",
      "This is the highest-probability mechanism: it produces more trials whether or not governments redirect a cent. Math: [dFDA impact](https://manual.warondisease.org/knowledge/economics/dfda-impact-paper.html).",
    ].join("\n"),
    impactStatement:
      "The treaty redirects money to trials; the dFDA is the trials. Funding it directly skips the politics.",
    // Wishonia's Wager: conditional value = annual peace dividend; probability = P(progress | dFDA funded).
    expectedEconomicValueUsdBase: PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT.value,
    successProbabilityBase: MECHANISM_DFDA_P_SUCCESS.value,
    sortOrder: -615,
    primaryEndpoint: {
      label: "Read the dFDA impact math",
      url: "https://manual.warondisease.org/knowledge/economics/dfda-impact-paper.html",
      instructions:
        "Read the impact math, then fund or build the decentralized FDA.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.OUTREACH,
    id: SHIRT_SEED_TASK_ID,
    taskKey: SHIRT_SEED_TASK_KEY,
    parentTaskId: END_WAR_AND_DISEASE_TASK_ID,
    title: "Seed the shirt cascade",
    description: [
      "Fund a seed of visible wearers — athletes, public figures, anyone with an audience — to wear the War on Disease shirt on Earth Optimization Day, triggering the cascade where everyone else writes the message on a shirt they already own for the cost of a marker.",
      "",
      "The seed pays about a million visible wearers; the grassroots cascade after it costs the world about $0.50 of ink per person. Math: [the funniest joke in the universe](https://manual.warondisease.org/knowledge/appendix/joke.html).",
    ].join("\n"),
    impactStatement:
      "A small paid seed of visible wearers turns into billions of free ones. The funder buys the spark, not the fire.",
    // Wishonia's Wager: conditional value = annual peace dividend; probability = P(treaty | shirt cascade funded).
    expectedEconomicValueUsdBase: PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT.value,
    successProbabilityBase: MECHANISM_SHIRT_CASCADE_P_SUCCESS.value,
    sortOrder: -605,
    primaryEndpoint: {
      label: "Read the shirt math",
      url: "/joke",
      instructions:
        "Read how the cascade works, then fund the seed or wear the shirt.",
    },
  },
  {
    id: "bed-nets-funding-gap",
    taskKey: "program:amf:bed-nets-funding-gap",
    parentTaskId: null,
    title: "Fund the Bed Nets Funding Gap",
    description:
      "Retired from the primary campaign task tree. Bed nets remain benchmark/reference material, not a direct War on Disease task.",
    retired: true,
  },
];
