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
import {
  TaskCategory,
  TaskClaimPolicy,
  TaskExecutionMode,
  TaskStatus,
} from "../generated/prisma/client.js";
import {
  EARTH_OPTIMIZATION_PRIZE_TASK_ID,
  EARTH_OPTIMIZATION_PRIZE_TASK_KEY,
  EOS_CAPITALIZE_TASK_ID,
  EOS_CAPITALIZE_TASK_KEY,
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
  END_DISEASE_TASK_ID,
  END_DISEASE_TASK_KEY,
  END_POVERTY_TASK_ID,
  END_POVERTY_TASK_KEY,
  END_WAR_AND_DISEASE_TASK_ID,
  END_WAR_AND_DISEASE_TASK_KEY,
  END_WAR_TASK_ID,
  END_WAR_TASK_KEY,
  MINIMIZE_ANIMAL_SUFFERING_TASK_ID,
  MINIMIZE_ANIMAL_SUFFERING_TASK_KEY,
  PREVENT_EXTINCTION_TASK_ID,
  PREVENT_EXTINCTION_TASK_KEY,
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
  TASK_GRAPH_STEWARD_TASK_ID,
  TASK_GRAPH_STEWARD_TASK_KEY,
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
      "This is the root task. There are two goals. Increase the median number of healthy life years. Increase the median income after tax.",
      "",
      "Humanity loses approximately $101 trillion each year to the [Political Dysfunction Tax](https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html). This is the difference between the welfare that governments produce and the welfare that governments can produce.",
      "",
      "Each task below this task decreases that loss. Optimitron calculates an expected value for each task. Optimitron then shows the tasks in sequence, from the highest value to the lowest value.",
    ].join("\n"),
    impactStatement:
      "Each task below this task increases median healthy life years, increases median income, or increases the probability that humanity survives to have both.",
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
  // Mission layer: the deliberate set of peer nodes directly under the root.
  // Missions carry no economics scalars — their EV is the roll-up of the
  // strategies beneath them, and the sync skips impact writes without scalars,
  // so an empty mission cannot inflate any ranking.
  {
    ...defaultTaskFields,
    category: TaskCategory.GOVERNANCE,
    id: END_WAR_TASK_ID,
    taskKey: END_WAR_TASK_KEY,
    parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
    title: "End War",
    description: [
      "This is a mission task. The goal is the end of war.",
      "",
      "Governments keep 12,241 nuclear warheads. Approximately 100 warheads are sufficient to end civilization. Governments thus keep 122 times more destructive capacity than necessary.",
      "",
      "Add a task below this task if the task decreases that capacity, or decreases the money that pays for it. Optimitron calculates an expected value for each task. Optimitron then shows the tasks in sequence, from the highest value to the lowest value.",
      "",
      "These three tasks have the highest value now: the 1% Treaty, the Court of Humanity, and the Loving Takeover. If your task has a higher value, your task becomes the first task.",
    ].join("\n"),
    impactStatement:
      "Governments keep 122 times more destructive capacity than civilization can survive. Each task below this task decreases that capacity, or decreases the money that pays for it.",
    // TODO(param): mission EV is the child roll-up; do not add scalars here.
    sortOrder: -980,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.RESEARCH,
    id: END_DISEASE_TASK_ID,
    taskKey: END_DISEASE_TASK_KEY,
    parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
    title: "End Disease",
    description: [
      "This is a mission task. The goal is the end of disease.",
      "",
      "6,650 diseases have no approved treatment. Medical researchers add approximately 15 new treatments each year. A test of all the possible treatments thus needs approximately 443 years.",
      "",
      "Add a task below this task if the task decreases that time. Optimitron calculates an expected value for each task. Optimitron then shows the tasks in sequence, from the highest value to the lowest value.",
      "",
      "Some tasks apply to this task and to the End War task at the same time. The 1% Treaty is an example. Money that pays for weapons is not available for medical tests.",
    ].join("\n"),
    impactStatement:
      "Disease causes more lost healthy life years than any other condition. Each task below this task decreases the time to a treatment.",
    // TODO(param): mission EV is the child roll-up; do not add scalars here.
    sortOrder: -970,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.GOVERNANCE,
    id: END_POVERTY_TASK_ID,
    taskKey: END_POVERTY_TASK_KEY,
    parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
    title: "End Poverty",
    description: [
      "This is a mission task. The goal is an increase of the median income of each person.",
      "",
      "Add a task below this task if the task increases the median real income after tax. Optimitron calculates an expected value for each task. Optimitron then shows the tasks in sequence, from the highest value to the lowest value.",
      "",
      "Some tasks apply to this task and to the other mission tasks at the same time. The 1% Treaty, the Loving Takeover, and better public budgets are examples. War decreases income. Disease decreases income.",
    ].join("\n"),
    impactStatement:
      "The median income is one of the two measurements of Earth optimization. Each task below this task increases it.",
    // TODO(param): mission EV is the child roll-up; do not add scalars here.
    sortOrder: -960,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.RESEARCH,
    id: PREVENT_EXTINCTION_TASK_ID,
    taskKey: PREVENT_EXTINCTION_TASK_KEY,
    parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
    title: "Prevent Extinction",
    description: [
      "This is a mission task. The goal is the survival of humanity.",
      "",
      "WARNING: This task is not complete. It has no tasks below it and no expected value. Do not use this task for a comparison of values.",
      "",
      "Toby Ord estimates the probability of an existential catastrophe in this century at approximately 1 in 6. The largest part is unaligned artificial intelligence at approximately 1 in 10. Engineered pandemics are approximately 1 in 30. Nuclear war is approximately 1 in 1,000.",
      "",
      "An extinction event sets the value of every other mission task to zero. This task therefore multiplies the other mission tasks. It does not compete with them.",
      "",
      "Add a task below this task if the task decreases one of these probabilities. Give the cost of the task and the effect of the task. Optimitron then calculates an expected value.",
    ].join("\n"),
    impactStatement:
      "An extinction event sets the value of all other work to zero. Each task below this task decreases the probability of that event.",
    interestTags: [],
    // DRAFT + no economics scalars, same rule as the animal-suffering stub: a
    // mission with nothing under it stays visible as intent without entering
    // active queues or EV roll-ups.
    status: TaskStatus.DRAFT,
    sortOrder: -955,
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.OTHER,
    id: MINIMIZE_ANIMAL_SUFFERING_TASK_ID,
    taskKey: MINIMIZE_ANIMAL_SUFFERING_TASK_KEY,
    parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
    title: "Minimize Animal Suffering",
    description: [
      "This is a mission task. The goal is a decrease of the suffering of animals.",
      "",
      "WARNING: This task is not complete. It has no tasks below it and no expected value. Do not use this task for a comparison of values.",
      "",
      "Humans kill approximately 88 billion land animals each year. Humans also kill approximately 440 billion farmed shrimp and approximately 124 billion farmed fish each year. Persons give approximately $260 million each year to decrease this suffering. This is approximately 0.3 cents for each land animal.",
      "",
      "Add a task below this task. Give the cost of the task and the effect of the task. Optimitron then calculates an expected value.",
    ].join("\n"),
    impactStatement:
      "This task has no expected value now. Add tasks and data below it before you compare this task to other tasks.",
    interestTags: [],
    // DRAFT + no economics scalars: the stub stays visible as intent without
    // entering active queues or EV roll-ups.
    status: TaskStatus.DRAFT,
    sortOrder: -950,
  },
  {
    ...defaultTaskFields,
    id: END_WAR_AND_DISEASE_TASK_ID,
    taskKey: END_WAR_AND_DISEASE_TASK_KEY,
    // Legacy combined node, demoted off the root under End War. Its runtime
    // children (end-dementia, cognitron-labs, gov-tomorrow, ...) are re-homed
    // via MCP after this deploys; retire the node once they are moved.
    parentTaskId: END_WAR_TASK_ID,
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
    parentTaskId: END_WAR_TASK_ID,
    // The court's whole purpose is to force the treaty settlement, so it
    // inherits the treaty's mission set.
    edges: [
      { toTaskId: END_DISEASE_TASK_ID },
      { toTaskId: END_POVERTY_TASK_ID },
    ],
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
    parentTaskId: END_WAR_TASK_ID,
    // The treaty serves every mission. It cuts military spending (End War),
    // funds pragmatic trials with the proceeds (End Disease), pays a peace
    // dividend (End Poverty), and takes a bite out of the nuclear arsenal
    // (Prevent Extinction). End War is the roll-up parent because that is
    // where the treaty acts; the rest are edges so the value is claimed once.
    // Deltas stay null until they can be sourced from the parameter catalog.
    edges: [
      { toTaskId: END_DISEASE_TASK_ID },
      { toTaskId: END_POVERTY_TASK_ID },
      { toTaskId: PREVENT_EXTINCTION_TASK_ID },
    ],
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
    parentTaskId: END_WAR_TASK_ID,
    // Redirects contractor lobbying toward the treaty, and the shareholder
    // case is explicitly an income argument.
    edges: [
      { toTaskId: END_DISEASE_TASK_ID },
      { toTaskId: END_POVERTY_TASK_ID },
    ],
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
    // Funds the treaty referendum — serves the missions through the treaty.
    parentTaskId: TREATY_PARENT_TASK_ID,
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
    // Capital for the whole machine; primary under End War (the campaign it
    // funds first), edged to the other missions via TaskEdge after deploy.
    parentTaskId: END_WAR_TASK_ID,
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
    category: TaskCategory.GOVERNANCE,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    executionMode: TaskExecutionMode.AGENT_ONLY,
    isPublic: false,
    id: TASK_GRAPH_STEWARD_TASK_ID,
    taskKey: TASK_GRAPH_STEWARD_TASK_KEY,
    // Operational agent work, not a mission — lives under the dev program so
    // the root keeps only missions + org/personal/dev containers.
    parentTaskId: OPTIMITRON_DEV_TASK_ID,
    title: "Steward the Optimize Earth task graph",
    description: [
      "Continuously keep the Optimize Earth task tree coherent, complete, and routable.",
      "",
      "The steward audits ancestry, missing parents, duplicate work, stale or missing execution metadata, candidate coverage, and agent-eligible work. It may repair clearly mechanical metadata defects, research and save candidate suggestions, and complete bounded non-development tasks with evidence.",
      "",
      "It must propose—rather than execute—ambiguous merges or reparenting, human assignment or contact, public impact publication, spending, deployment, and other external actions. Development work is routed to Mike unless he explicitly delegates it.",
    ].join("\n"),
    impactStatement:
      "A coherent, fully routed task graph keeps high-value work discoverable and prevents duplicate or orphaned effort.",
    estimatedEffortHours: 2,
    estimatedHoursPerWeekMin: 1,
    estimatedHoursPerWeekMax: 4,
    skillTags: ["task governance", "task routing", "research"],
    preferredToolTags: ["optimitron-mcp", "web-search"],
    contextJson: {
      value: 50000,
      cash_cost: 0,
      p_success: 0.8,
      executor_type: "AI Agent",
      rootTaskKey: "optimize-earth",
      developmentOwner: "Mike",
      stewardPolicyVersion: "task-graph-steward.v1",
      automaticActions: [
        "audit",
        "candidate-research",
        "candidate-suggestion",
        "mechanical-metadata-repair",
        "bounded-non-development-execution",
      ],
      approvalRequired: [
        "ambiguous-merge",
        "ambiguous-reparent",
        "human-assignment",
        "human-contact",
        "external-action",
        "spending",
        "public-impact-publication",
        "deployment",
      ],
      acceptanceCriteria: [
        "The complete Optimize Earth tree is audited on the scheduled daily and weekly cadences.",
        "Each finding has a stable identifier, severity, evidence, and a proposed next action.",
        "Clearly safe metadata repairs and bounded non-development work are completed with evidence.",
        "Ambiguous structural changes, human outreach or assignment, spending, publication, and deployment remain pending explicit human approval.",
        "Development tasks are routed to Mike or left as candidate suggestions unless explicitly delegated.",
      ],
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.RESEARCH,
    id: DFDA_CREATE_TASK_ID,
    taskKey: DFDA_CREATE_TASK_KEY,
    parentTaskId: END_DISEASE_TASK_ID,
    // Cheaper trials mean less disease, and disease is a drag on income.
    edges: [{ toTaskId: END_POVERTY_TASK_ID }],
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
      instructions: "Read the impact math, then fund or build the decentralized FDA.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.OUTREACH,
    id: SHIRT_SEED_TASK_ID,
    taskKey: SHIRT_SEED_TASK_KEY,
    // Campaign tactic whose payoff is treaty votes — hangs under the treaty.
    parentTaskId: TREATY_PARENT_TASK_ID,
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
