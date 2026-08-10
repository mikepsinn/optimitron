import {
  END_DISEASE_MISSION_SCENARIO_VALUE_USD,
  END_POVERTY_MISSION_SCENARIO_VALUE_USD,
  END_WAR_MISSION_SCENARIO_VALUE_USD,
  MISSION_VALUE_HORIZON_YEARS,
  OPTIMIZE_EARTH_MISSION_SCENARIO_VALUE_USD,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
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
  EOS_CALCULATE_POLICY_BUDGETS_TASK_ID,
  EOS_CALCULATE_POLICY_BUDGETS_TASK_KEY,
  EOS_CAPITALIZE_TASK_ID,
  EOS_CAPITALIZE_TASK_KEY,
  EOS_FUND_EVIDENCE_TASK_ID,
  EOS_FUND_EVIDENCE_TASK_KEY,
  EOS_IMPLEMENT_INTERVENTIONS_TASK_ID,
  EOS_IMPLEMENT_INTERVENTIONS_TASK_KEY,
  LOVING_TAKEOVER_ACQUIRE_STAKES_TASK_ID,
  LOVING_TAKEOVER_ACQUIRE_STAKES_TASK_KEY,
  LOVING_TAKEOVER_FILE_COMPLAINT_TASK_ID,
  LOVING_TAKEOVER_FILE_COMPLAINT_TASK_KEY,
  LOVING_TAKEOVER_LITIGATION_TASK_ID,
  LOVING_TAKEOVER_LITIGATION_TASK_KEY,
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

const taxonomyTaskFields = {
  ...defaultTaskFields,
  contextJson: { optimizeEarthNodeKind: "taxonomy" },
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
      `Humanity loses approximately $${Math.round(POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL.value / 1e12)} trillion each year to the [Political Dysfunction Tax](https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html). This is the difference between the welfare that governments produce and the welfare that governments can produce.`,
      "",
      `The value-if-achieved scenario applies that annual loss across the ${MISSION_VALUE_HORIZON_YEARS}-year mission comparison period: approximately $${(OPTIMIZE_EARTH_MISSION_SCENARIO_VALUE_USD / 1e15).toFixed(1)} quadrillion. It does not add the overlapping mission values below this task. It does not estimate the probability of success.`,
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
    // treaty-accountability owns the root's win-condition and delay metrics.
    impactEstimateManagedExternally: true,
    sortOrder: -1000,
    primaryEndpoint: {
      label: "Open the Optimize Earth task tree",
      url: "/tasks/optimize-earth",
      instructions:
        "Open the root task and choose the highest-leverage child task you can complete.",
    },
  },
  // Mission layer: the deliberate set of peer nodes directly under the root.
  // Mission values come from sourced scenarios, not child-task rollups. Child
  // values overlap, so a rollup would count the same outcome more than once.
  // Missions omit probability; mechanisms use marginal, probability-weighted
  // values. Missions without sourced scenarios remain blank.
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
    // Whole cost of war, not the Treaty campaign's smaller peace dividend.
    // This is a probability-free scenario value, not a ranking input.
    valueIfAchievedUsdBase: END_WAR_MISSION_SCENARIO_VALUE_USD,
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
    // Economic drag only. The scenario does not price pain or suffering.
    valueIfAchievedUsdBase: END_DISEASE_MISSION_SCENARIO_VALUE_USD,
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
      "The value-if-achieved scenario closes the annual gap between the current $2,138 global median income and the $4,381 Earth Optimization Prize target. It applies that gap to the current population for 73.4 years. It does not estimate the probability of success.",
      "",
      "Add a task below this task if the task increases the median real income after tax. Optimitron calculates an expected value for each task. Optimitron then shows the tasks in sequence, from the highest value to the lowest value.",
      "",
      "Some tasks apply to this task and to the other mission tasks at the same time. The 1% Treaty, the Loving Takeover, and better public budgets are examples. War decreases income. Disease decreases income.",
    ].join("\n"),
    impactStatement:
      "The median income is one of the two measurements of Earth optimization. Each task below this task increases it.",
    // Annual gap from today's median income to the prize target, applied to a
    // population-equivalent scenario over the common mission horizon.
    valueIfAchievedUsdBase: END_POVERTY_MISSION_SCENARIO_VALUE_USD,
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
      "The categories below identify recognized global catastrophic threats. Add concrete risk-reduction tasks below the applicable categories.",
      "",
      "Toby Ord estimates the probability of an existential catastrophe in this century at approximately 1 in 6. The largest part is unaligned artificial intelligence at approximately 1 in 10. Engineered pandemics are approximately 1 in 30. Nuclear war is approximately 1 in 1,000.",
      "",
      "The method page keeps a current-lives mortality-risk scenario for context. The task tree does not compare it with annual mission values.",
      "",
      "An extinction event sets the value of every other mission task to zero. This task therefore multiplies the other mission tasks. It does not compete with them.",
      "",
      "Add a task below this task if the task decreases one of these probabilities. Give the cost of the task and the effect of the task. Optimitron then calculates an expected value.",
    ].join("\n"),
    impactStatement:
      "An extinction event sets the value of all other work to zero. Each task below this task decreases the probability of that event.",
    interestTags: [],
    // Null explicitly retires the previous managed mission-value frame.
    valueIfAchievedUsdBase: null,
    status: TaskStatus.ACTIVE,
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
      "The categories below identify major animal contexts. Add concrete welfare tasks below the applicable categories.",
      "",
      "Humans kill approximately 88 billion land animals each year. Humans also kill approximately 440 billion farmed shrimp and approximately 124 billion farmed fish each year.",
      "",
      "[Animal Charity Evaluators reports](https://animalcharityevaluators.org/blog/better-for-animals-the-evidence-behind-conducting-research-for-effective-advocacy/) $260 million in farmed-animal advocacy funding for 2024. This excludes companion-animal markets, wild-animal welfare, and most direct animal care.",
      "",
      "Advocacy funding is an input cost. It is not the value of ending animal suffering. The task tree leaves this mission value empty until a species-weighted welfare model exists.",
      "",
      "Add a task below this task. Give the cost of the task and the effect of the task. Optimitron then calculates an expected value.",
    ].join("\n"),
    impactStatement:
      "Each task below this mission decreases the number, duration, or intensity of harmful animal experiences.",
    interestTags: [],
    // Null explicitly retires the previous managed mission-value frame.
    valueIfAchievedUsdBase: null,
    status: TaskStatus.ACTIVE,
    sortOrder: -950,
  },
  // Published global catastrophic-risk categories. These are durable taxonomy
  // nodes, not quantified interventions. Keep them DRAFT and leave economics
  // unset until sourced child programs provide the mission's EV.
  {
    ...taxonomyTaskFields,
    category: TaskCategory.RESEARCH,
    id: "prevent-severe-global-pandemics",
    taskKey: "optimize-earth:prevent-extinction:severe-global-pandemics",
    parentTaskId: PREVENT_EXTINCTION_TASK_ID,
    title: "Prevent Severe Global Pandemics",
    description: [
      "Prevent severe global pandemics that can destroy civilization.",
      "",
      "Add tasks for surveillance, prevention, response, and recovery below this task.",
      "",
      "Use sourced estimates for cost, risk reduction, and time to effect.",
      "",
      "The [Global Catastrophic Risk Management Act](https://www.congress.gov/bill/117th-congress/senate-bill/4488/text) identifies this threat category.",
    ].join("\n"),
    impactStatement:
      "Each child task reduces the probability or severity of a globally catastrophic pandemic.",
    interestTags: ["existential-risk", "pandemic-prevention"],
    skillTags: ["risk-analysis"],
    status: TaskStatus.DRAFT,
    sortOrder: -800,
  },
  {
    ...taxonomyTaskFields,
    category: TaskCategory.RESEARCH,
    id: "prevent-nuclear-catastrophe",
    taskKey: "optimize-earth:prevent-extinction:nuclear-catastrophe",
    parentTaskId: PREVENT_EXTINCTION_TASK_ID,
    title: "Prevent Nuclear Catastrophe",
    description: [
      "Prevent nuclear events that can cause global famine, civilizational collapse, or human extinction.",
      "",
      "Add tasks that reduce arsenals, launch risk, escalation risk, or nuclear-winter effects.",
      "",
      "Use sourced estimates for cost, risk reduction, and time to effect.",
      "",
      "The [Global Catastrophic Risk Management Act](https://www.congress.gov/bill/117th-congress/senate-bill/4488/text) identifies this threat category.",
    ].join("\n"),
    impactStatement:
      "Each child task reduces the probability or severity of a nuclear catastrophe.",
    interestTags: ["existential-risk", "nuclear-risk"],
    skillTags: ["risk-analysis"],
    status: TaskStatus.DRAFT,
    sortOrder: -790,
  },
  {
    ...taxonomyTaskFields,
    category: TaskCategory.RESEARCH,
    id: "prevent-catastrophic-climate-disruption",
    taskKey:
      "optimize-earth:prevent-extinction:catastrophic-climate-disruption",
    parentTaskId: PREVENT_EXTINCTION_TASK_ID,
    title: "Prevent Catastrophic Climate Disruption",
    description: [
      "Prevent sudden and severe climate changes that can destroy civilization.",
      "",
      "Add tasks that reduce hazards, exposure, vulnerability, or recovery time.",
      "",
      "Use sourced estimates for cost, risk reduction, and time to effect.",
      "",
      "The [Global Catastrophic Risk Management Act](https://www.congress.gov/bill/117th-congress/senate-bill/4488/text) identifies this threat category.",
    ].join("\n"),
    impactStatement:
      "Each child task reduces the probability or severity of catastrophic climate disruption.",
    interestTags: ["existential-risk", "climate-risk"],
    skillTags: ["risk-analysis"],
    status: TaskStatus.DRAFT,
    sortOrder: -780,
  },
  {
    ...taxonomyTaskFields,
    category: TaskCategory.RESEARCH,
    id: "prevent-catastrophic-emerging-technology-failures",
    taskKey: "optimize-earth:prevent-extinction:emerging-technology-failures",
    parentTaskId: PREVENT_EXTINCTION_TASK_ID,
    title: "Prevent Catastrophic New-Technology Failures",
    description: [
      "Prevent intentional or accidental new-technology failures that can destroy civilization.",
      "",
      "Add tasks for technical safety, governance, audits, containment, and response.",
      "",
      "Use sourced estimates for cost, risk reduction, and time to effect.",
      "",
      "The [Global Catastrophic Risk Management Act](https://www.congress.gov/bill/117th-congress/senate-bill/4488/text) identifies this threat category.",
    ].join("\n"),
    impactStatement:
      "Each child task reduces catastrophic risk from an emerging technology.",
    interestTags: ["existential-risk", "technology-safety"],
    skillTags: ["risk-analysis"],
    status: TaskStatus.DRAFT,
    sortOrder: -770,
  },
  {
    ...taxonomyTaskFields,
    category: TaskCategory.RESEARCH,
    id: "prevent-asteroid-and-comet-impacts",
    taskKey: "optimize-earth:prevent-extinction:asteroid-comet-impacts",
    parentTaskId: PREVENT_EXTINCTION_TASK_ID,
    title: "Prevent Asteroid and Comet Impacts",
    description: [
      "Prevent asteroid and comet impacts that can destroy civilization.",
      "",
      "Add tasks for detection, deflection, response, and recovery.",
      "",
      "Use sourced estimates for cost, risk reduction, and time to effect.",
      "",
      "The [Global Catastrophic Risk Management Act](https://www.congress.gov/bill/117th-congress/senate-bill/4488/text) identifies this threat category.",
    ].join("\n"),
    impactStatement:
      "Each child task reduces the probability or severity of a catastrophic impact.",
    interestTags: ["existential-risk", "planetary-defense"],
    skillTags: ["risk-analysis"],
    status: TaskStatus.DRAFT,
    sortOrder: -760,
  },
  {
    ...taxonomyTaskFields,
    category: TaskCategory.RESEARCH,
    id: "prevent-supervolcanic-catastrophe",
    taskKey: "optimize-earth:prevent-extinction:supervolcanic-catastrophe",
    parentTaskId: PREVENT_EXTINCTION_TASK_ID,
    title: "Prevent Supervolcanic Catastrophe",
    description: [
      "Prevent supervolcanic events that can destroy civilization.",
      "",
      "Add tasks for detection, preparedness, food resilience, and recovery.",
      "",
      "Use sourced estimates for cost, risk reduction, and time to effect.",
      "",
      "The [Global Catastrophic Risk Management Act](https://www.congress.gov/bill/117th-congress/senate-bill/4488/text) identifies this threat category.",
    ].join("\n"),
    impactStatement:
      "Each child task reduces the probability or severity of a supervolcanic catastrophe.",
    interestTags: ["existential-risk", "supervolcano-risk"],
    skillTags: ["risk-analysis"],
    status: TaskStatus.DRAFT,
    sortOrder: -750,
  },
  // Published animal-welfare contexts. These are durable taxonomy nodes. Use
  // the Five Domains model for welfare effects and keep concrete interventions
  // with sourced estimates as live child tasks.
  {
    ...taxonomyTaskFields,
    category: TaskCategory.OTHER,
    id: "reduce-terrestrial-animal-production-suffering",
    taskKey:
      "optimize-earth:minimize-animal-suffering:terrestrial-production-suffering",
    parentTaskId: MINIMIZE_ANIMAL_SUFFERING_TASK_ID,
    title: "Reduce Suffering in Terrestrial Animal Production",
    description: [
      "Reduce suffering in terrestrial animal production systems.",
      "",
      "Add tasks for food, shelter, health, behavior, genetics, standards, or enforcement.",
      "",
      "Use the [Five Domains model](https://pmc.ncbi.nlm.nih.gov/articles/PMC7602120/) to measure welfare effects.",
      "",
      "Use [WOAH standards](https://www.woah.org/en/what-we-do/animal-health-and-welfare/animal-welfare/development-of-animal-welfare-standards/) to classify production contexts.",
    ].join("\n"),
    impactStatement:
      "Each child task reduces harmful experiences among terrestrial farmed animals.",
    interestTags: ["animal-welfare", "terrestrial-farming"],
    skillTags: ["animal-welfare"],
    status: TaskStatus.DRAFT,
    sortOrder: -800,
  },
  {
    ...taxonomyTaskFields,
    category: TaskCategory.OTHER,
    id: "reduce-aquatic-animal-production-suffering",
    taskKey:
      "optimize-earth:minimize-animal-suffering:aquatic-production-suffering",
    parentTaskId: MINIMIZE_ANIMAL_SUFFERING_TASK_ID,
    title: "Reduce Suffering in Aquatic Animal Production",
    description: [
      "Reduce suffering in aquatic animal production systems.",
      "",
      "Add tasks for food, environments, health, behavior, transport, stun methods, slaughter, standards, or enforcement.",
      "",
      "Use the [Five Domains model](https://pmc.ncbi.nlm.nih.gov/articles/PMC7602120/) to measure welfare effects.",
      "",
      "Use [WOAH standards](https://www.woah.org/en/what-we-do/animal-health-and-welfare/animal-welfare/development-of-animal-welfare-standards/) to classify aquatic contexts.",
    ].join("\n"),
    impactStatement:
      "Each child task reduces harmful experiences among farmed aquatic animals.",
    interestTags: ["animal-welfare", "aquatic-farming"],
    skillTags: ["animal-welfare"],
    status: TaskStatus.DRAFT,
    sortOrder: -790,
  },
  {
    ...taxonomyTaskFields,
    category: TaskCategory.OTHER,
    id: "reduce-animal-transport-and-slaughter-suffering",
    taskKey:
      "optimize-earth:minimize-animal-suffering:transport-and-slaughter-suffering",
    parentTaskId: MINIMIZE_ANIMAL_SUFFERING_TASK_ID,
    title: "Reduce Suffering During Animal Transport and Slaughter",
    description: [
      "Reduce suffering during animal transport and slaughter.",
      "",
      "Add tasks for equipment, procedures, staff skills, audits, standards, or enforcement.",
      "",
      "Use the [Five Domains model](https://pmc.ncbi.nlm.nih.gov/articles/PMC7602120/) to measure welfare effects.",
      "",
      "Use [WOAH standards](https://www.woah.org/en/what-we-do/animal-health-and-welfare/animal-welfare/development-of-animal-welfare-standards/) to classify transport and slaughter contexts.",
    ].join("\n"),
    impactStatement:
      "Each child task reduces harmful experiences during transport or slaughter.",
    interestTags: ["animal-welfare", "transport", "slaughter"],
    skillTags: ["animal-welfare"],
    status: TaskStatus.DRAFT,
    sortOrder: -780,
  },
  {
    ...taxonomyTaskFields,
    category: TaskCategory.RESEARCH,
    id: "reduce-research-and-education-animal-suffering",
    taskKey:
      "optimize-earth:minimize-animal-suffering:research-and-education-suffering",
    parentTaskId: MINIMIZE_ANIMAL_SUFFERING_TASK_ID,
    title: "Reduce Suffering in Animal Research and Education",
    description: [
      "Reduce suffering among animals used in research and education.",
      "",
      "Add tasks that replace animal use, reduce animal counts, refine procedures, or enforce standards.",
      "",
      "Use the [Five Domains model](https://pmc.ncbi.nlm.nih.gov/articles/PMC7602120/) to measure welfare effects.",
      "",
      "Use [WOAH standards](https://www.woah.org/en/what-we-do/animal-health-and-welfare/animal-welfare/development-of-animal-welfare-standards/) to classify research contexts.",
    ].join("\n"),
    impactStatement:
      "Each child task reduces harmful experiences among animals used in research or education.",
    interestTags: ["animal-welfare", "research-animals"],
    skillTags: ["animal-welfare"],
    status: TaskStatus.DRAFT,
    sortOrder: -770,
  },
  {
    ...taxonomyTaskFields,
    category: TaskCategory.OTHER,
    id: "reduce-work-and-companion-animal-suffering",
    taskKey:
      "optimize-earth:minimize-animal-suffering:work-and-companion-animal-suffering",
    parentTaskId: MINIMIZE_ANIMAL_SUFFERING_TASK_ID,
    title: "Reduce Suffering Among Work and Companion Animals",
    description: [
      "Reduce suffering among animals used for work or companionship.",
      "",
      "Add tasks for care, health, environments, behavior, breeding, population management, standards, or enforcement.",
      "",
      "Use the [Five Domains model](https://pmc.ncbi.nlm.nih.gov/articles/PMC7602120/) to measure welfare effects.",
      "",
      "Use [WOAH standards](https://www.woah.org/en/what-we-do/animal-health-and-welfare/animal-welfare/development-of-animal-welfare-standards/) to classify work-animal and population-management contexts.",
    ].join("\n"),
    impactStatement:
      "Each child task reduces harmful experiences among working or companion animals.",
    interestTags: ["animal-welfare", "working-animals", "companion-animals"],
    skillTags: ["animal-welfare"],
    status: TaskStatus.DRAFT,
    sortOrder: -760,
  },
  {
    ...taxonomyTaskFields,
    category: TaskCategory.RESEARCH,
    id: "reduce-wild-animal-suffering",
    taskKey: "optimize-earth:minimize-animal-suffering:wild-animals",
    parentTaskId: MINIMIZE_ANIMAL_SUFFERING_TASK_ID,
    title: "Reduce Wild-Animal Suffering",
    description: [
      "Reduce suffering among wild animals.",
      "",
      "Add tasks that address disease, hunger, injury, harmful human activity, or large ecological harms.",
      "",
      "Use species-specific evidence and the [Five Domains model](https://pmc.ncbi.nlm.nih.gov/articles/PMC7602120/) to measure welfare effects.",
    ].join("\n"),
    impactStatement:
      "Each child task reduces the number, duration, or intensity of harmful wild-animal experiences.",
    interestTags: ["animal-welfare", "wild-animal-welfare"],
    skillTags: ["animal-welfare", "research"],
    status: TaskStatus.DRAFT,
    sortOrder: -750,
  },
  {
    ...defaultTaskFields,
    id: END_WAR_AND_DISEASE_TASK_ID,
    taskKey: END_WAR_AND_DISEASE_TASK_KEY,
    // Its runtime children now live under the mission branches. Keep this
    // explicit retired record so managed sync removes the empty legacy node.
    parentTaskId: END_WAR_TASK_ID,
    title: "End War and Disease",
    description:
      "Retired after its children moved under the End War and End Disease missions.",
    impactStatement: "The separate mission branches now own this work.",
    retired: true,
    sortOrder: -900,
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
    // treaty-accountability owns the native ~212-year impact model for this
    // task. The generic tree sync must not overwrite it with its annual frame.
    impactEstimateManagedExternally: true,
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
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    // Redirects contractor lobbying toward the treaty, and the shareholder
    // case is explicitly an income argument.
    edges: [
      { toTaskId: END_DISEASE_TASK_ID },
      { toTaskId: END_POVERTY_TASK_ID },
      { toTaskId: PREVENT_EXTINCTION_TASK_ID },
    ],
    title:
      "Use shareholder power to redirect corporate lobbying toward public welfare",
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
    category: TaskCategory.ORGANIZING,
    id: LOVING_TAKEOVER_ACQUIRE_STAKES_TASK_ID,
    taskKey: LOVING_TAKEOVER_ACQUIRE_STAKES_TASK_KEY,
    parentTaskId: LOVING_TAKEOVER_TASK_ID,
    title: "Acquire coordinated stakes in influential companies",
    description: [
      "Acquire activist stakes in companies whose lobbying shapes public budgets.",
      "Coordinate shareholder votes to influence boards without requiring outright control.",
    ].join("\n\n"),
    impactStatement:
      "Coordinated ownership turns dispersed public-welfare gains into concentrated corporate influence.",
    sortOrder: -655,
    primaryEndpoint: {
      label: "Read the takeover math",
      url: "https://manual.warondisease.org/knowledge/appendix/loving-takeover.html",
      instructions:
        "Review the target companies, stake sizes, and shareholder influence plan.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.OTHER,
    id: LOVING_TAKEOVER_OWN_ONE_SHARE_TASK_ID,
    taskKey: LOVING_TAKEOVER_OWN_ONE_SHARE_TASK_KEY,
    parentTaskId: LOVING_TAKEOVER_LITIGATION_TASK_ID,
    title: "Buy one share to gain shareholder rights",
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
    id: LOVING_TAKEOVER_LITIGATION_TASK_ID,
    taskKey: LOVING_TAKEOVER_LITIGATION_TASK_KEY,
    parentTaskId: LOVING_TAKEOVER_TASK_ID,
    title: "Use shareholder demands and derivative litigation",
    description: [
      "Present boards with evidence that harmful lobbying reduces long-term shareholder welfare.",
      "Use derivative litigation when a board refuses to investigate the documented risk.",
      "The Funniest Lawsuit in the Universe is the first military-contractor implementation.",
    ].join("\n\n"),
    impactStatement:
      "A formal demand converts public-welfare evidence into a board decision with a legal record.",
    sortOrder: -645,
    primaryEndpoint: {
      label: "Read the lawsuit draft",
      url: "https://manual.warondisease.org/knowledge/appendix/lawsuit.html",
      instructions:
        "Ask qualified counsel to review the draft before any demand or filing.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.LEGAL,
    id: LOVING_TAKEOVER_FILE_COMPLAINT_TASK_ID,
    taskKey: LOVING_TAKEOVER_FILE_COMPLAINT_TASK_KEY,
    parentTaskId: LOVING_TAKEOVER_LITIGATION_TASK_ID,
    title: "File a derivative complaint after board refusal",
    description: [
      "Retain qualified securities and derivative-litigation counsel.",
      "File only after the board refuses or fails to investigate the formal demand.",
      "Seek a settlement that redirects lobbying toward the highest-value verified policy.",
    ].join("\n\n"),
    impactStatement:
      "The complaint creates a legal path from ignored evidence to a negotiated lobbying redirect.",
    sortOrder: -635,
    primaryEndpoint: {
      label: "Read the filing sequence",
      url: "https://manual.warondisease.org/knowledge/appendix/lawsuit.html",
      instructions:
        "Verify standing, preserve the board response, and follow counsel's filing instructions.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.LEGAL,
    id: LOVING_TAKEOVER_LOVE_LETTER_TASK_ID,
    taskKey: LOVING_TAKEOVER_LOVE_LETTER_TASK_KEY,
    parentTaskId: LOVING_TAKEOVER_LITIGATION_TASK_ID,
    title: "Submit a shareholder demand to the board",
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
    title: `Redirect the $${Math.round(DEFENSE_LOBBYING_ANNUAL.value / 1e6)}M military lobbying budget toward public welfare`,
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
    // Capital for the whole machine; primary under End War (the first
    // implementation), with mission placement through managed task edges.
    parentTaskId: END_WAR_TASK_ID,
    edges: [
      { toTaskId: END_DISEASE_TASK_ID },
      { toTaskId: END_POVERTY_TASK_ID },
      { toTaskId: PREVENT_EXTINCTION_TASK_ID },
    ],
    title: "Build and capitalize a public-welfare investment company",
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
    ...defaultTaskFields,
    category: TaskCategory.RESEARCH,
    id: EOS_FUND_EVIDENCE_TASK_ID,
    taskKey: EOS_FUND_EVIDENCE_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Fund causal evidence and welfare measurement tools",
    description: [
      "Fund systems that measure policy effects on median healthy life expectancy and median income.",
      "Publish assumptions, sources, uncertainty ranges, and outcome measurements.",
    ].join("\n\n"),
    impactStatement:
      "Reliable evidence lets capital distinguish measurable welfare gains from persuasive claims.",
    sortOrder: -608,
    primaryEndpoint: {
      label: "Review Earth Optimization Services",
      url: "/eos",
      instructions:
        "Review the evidence engine and fund its highest-value gap.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.RESEARCH,
    id: EOS_CALCULATE_POLICY_BUDGETS_TASK_ID,
    taskKey: EOS_CALCULATE_POLICY_BUDGETS_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Calculate welfare-maximizing policies and public budgets",
    description: [
      "Compare policy and budget outcomes across jurisdictions.",
      "Rank changes by their effects on median health and median after-tax income.",
    ].join("\n\n"),
    impactStatement:
      "Governments and shareholders need a measurable destination before they redirect money or influence.",
    sortOrder: -607,
    primaryEndpoint: {
      label: "Review the optimization method",
      url: "/methodology",
      instructions:
        "Review the method and improve the weakest evidence inputs.",
    },
  },
  {
    ...defaultTaskFields,
    category: TaskCategory.ORGANIZING,
    id: EOS_IMPLEMENT_INTERVENTIONS_TASK_ID,
    taskKey: EOS_IMPLEMENT_INTERVENTIONS_TASK_KEY,
    parentTaskId: EOS_CAPITALIZE_TASK_ID,
    title: "Fund and implement the highest-value verified interventions",
    description: [
      "Allocate capital to the highest-value interventions supported by reviewed evidence.",
      "Measure results and update the ranking when reality contradicts the forecast.",
    ].join("\n\n"),
    impactStatement:
      "Analysis creates value only when capital reaches the interventions that the evidence ranks first.",
    sortOrder: -606,
    primaryEndpoint: {
      label: "Open the fund",
      url: "/fund",
      instructions:
        "Review the ranked opportunities, then invest or book a call.",
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
    title: "Fund faster, cheaper pragmatic clinical trials",
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
