import {
  TaskCategory,
  TaskClaimPolicy,
  TaskDifficulty,
} from "../generated/prisma/client.js";
import {
  COURT_OF_HUMANITY_CHARTER_TASK_ID,
  COURT_OF_HUMANITY_CHARTER_TASK_KEY,
  COURT_OF_HUMANITY_TASK_ID,
  COURT_OF_HUMANITY_TASK_KEY,
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
  OPTIMIZE_EARTH_ROOT_TASK_ID,
  OPTIMIZE_EARTH_ROOT_TASK_KEY,
  PUBLISH_EVIDENCE_AND_DAMAGES_TASK_ID,
  PUBLISH_EVIDENCE_AND_DAMAGES_TASK_KEY,
  REGISTER_PLAINTIFFS_TASK_ID,
  REGISTER_PLAINTIFFS_TASK_KEY,
  RENDER_VERDICT_TASK_ID,
  RENDER_VERDICT_TASK_KEY,
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
  difficulty: TaskDifficulty.INTERMEDIATE,
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
      "The current bottleneck is ending war and disease. Everything below this task should either help humans vote, recruit two more humans, register plaintiffs, summon jurors, pressure leaders, or make the 1% Treaty credible enough to pass.",
    ].join("\n"),
    impactStatement:
      "Every task below exists to move humanity from delay to welfare.",
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
      instructions:
        `Register a plaintiff in ${HUMANITY_V_GOVERNMENT_CASE_NAME}.`,
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.OUTREACH,
    id: SUMMON_JURORS_TASK_ID,
    taskKey: SUMMON_JURORS_TASK_KEY,
    parentTaskId: HUMANITY_V_GOVERNMENTS_TASK_ID,
    title: "Summon jurors",
    description:
      `Invite humans to act as jurors by voting on the verdict in ${HUMANITY_V_GOVERNMENT_CASE_NAME}.`,
    impactStatement:
      "A court for humanity needs a jury large enough to matter.",
    sortOrder: -760,
    primaryEndpoint: {
      label: "Open the referral dashboard",
      url: "/dashboard",
      instructions:
        "Invite at least two humans to vote on the case.",
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
      "Use the verdict to force the settlement: redirect one percent of military spending into pragmatic clinical trials and disease eradication.",
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
    // Keep the cost-of-delay counters on `/employees` and similar treaty
    // surfaces live by preserving an overdue `dueAt`. The managed-sync
    // overwrites whatever the seed wrote, so we have to set it here too.
    dueAt: new Date("2024-12-31T00:00:00.000Z"),
    sortOrder: -700,
    primaryEndpoint: {
      label: "Sign the 1% Treaty",
      url: "/vote",
      instructions:
        "Sign the treaty, share it, and then pressure the leaders who still have not signed.",
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
      "Pressure every head of government to sign the 1% Treaty. One signature. One pen. Thirty seconds.",
    impactStatement:
      "The government-side task is not vague adoption. It is 193 named humans signing.",
    sortOrder: -680,
    primaryEndpoint: {
      label: "Manage presidents",
      url: "/employees",
      instructions:
        "Pick an overdue head of government and pressure them to sign.",
    },
  },
  {
    id: "dfda",
    taskKey: "program:dfda:create",
    parentTaskId: null,
    title: "12x More Clinical Trials",
    description:
      "Retired from the primary campaign task tree. The dFDA remains supporting infrastructure, not a direct Optimize Earth child.",
    retired: true,
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
