import type { EarthNextActionDecision, TaskTreeNode } from "@optimitron/agent";
import { ROUTES } from "./routes";
import { slugify } from "./slugify";
import { absoluteCanonicalSiteUrl } from "./site";
import {
  buildOptimizeEarthActionFollowThroughKey,
  buildOptimizeEarthPrepareApprovalPacketKey,
  buildOptimizeEarthPublishBudgetBriefKey,
  buildOptimizeEarthRouteProofPagesKey,
  buildOptimizeEarthSourceCounterpartiesKey,
  OPTIMIZE_EARTH_ACTION_FOLLOW_THROUGH_KEY_PREFIXES,
  OPTIMIZE_EARTH_CONVERT_PITCH_PAGES_KEY,
  OPTIMIZE_EARTH_CROSSLINK_PAGES_KEY,
  OPTIMIZE_EARTH_DISCOVER_OFFICE_CHANNELS_KEY,
  OPTIMIZE_EARTH_DISCOVER_PRESS_KEY,
  OPTIMIZE_EARTH_GENERATE_CONTACT_DISCOVERY_KEY,
  OPTIMIZE_EARTH_GENERATE_GROWTH_TASKS_KEY,
  OPTIMIZE_EARTH_GENERATE_SYSTEM_IMPROVEMENT_KEY,
  OPTIMIZE_EARTH_GROUND_GENERATOR_KEY,
  OPTIMIZE_EARTH_WEAPONIZE_OVERDUE_TASK_LIST_KEY,
} from "./tasks/task-keys";

const EARTH_OPTIMIZATION_PRIZE_URL =
  "https://manual.warondisease.org/knowledge/strategy/earth-optimization-prize.html";
const INCENTIVE_ALIGNMENT_BONDS_URL =
  "https://manual.warondisease.org/knowledge/appendix/incentive-alignment-bonds-paper.html";
const EARTH_OPTIMIZATION_PROTOCOL_URL =
  "https://manual.warondisease.org/strategy/earth-optimization-protocol-v1";

interface PageContext {
  filePath: string;
  purpose: string;
  route: string;
  title: string;
}

function absoluteUrl(route: string) {
  return absoluteCanonicalSiteUrl(route);
}

function scaleImpact(
  impact: TaskTreeNode["impact"],
  multiplier: number,
): TaskTreeNode["impact"] {
  if (!impact) {
    return impact ?? null;
  }

  return {
    delayDalysLostPerDay:
      impact.delayDalysLostPerDay == null
        ? null
        : impact.delayDalysLostPerDay * multiplier,
    delayEconomicValueUsdLostPerDay:
      impact.delayEconomicValueUsdLostPerDay == null
        ? null
        : impact.delayEconomicValueUsdLostPerDay * multiplier,
    expectedValuePerHourDalys:
      impact.expectedValuePerHourDalys == null
        ? null
        : impact.expectedValuePerHourDalys * multiplier,
    expectedValuePerHourUsd:
      impact.expectedValuePerHourUsd == null
        ? null
        : impact.expectedValuePerHourUsd * multiplier,
  };
}

const CORE_PAGE_CONTEXT: Record<string, PageContext> = {
  demo: {
    filePath: "packages/web/src/app/demo/page.tsx",
    purpose: "Long-form persuasion and onboarding flow.",
    route: ROUTES.demo,
    title: "Demo",
  },
  governments: {
    filePath: "packages/web/src/app/governments/page.tsx",
    purpose: "Public comparative government report card and scatterplot.",
    route: ROUTES.governments,
    title: "Government Report Cards",
  },
  politicians: {
    filePath: "packages/web/src/app/governments/[code]/politicians/page.tsx",
    purpose: "Country politician leaderboard and accountability rankings.",
    route: "/governments/US/politicians",
    title: "Politician Leaderboard",
  },
  scoreboard: {
    filePath: "packages/web/src/app/scoreboard/page.tsx",
    purpose: "Two-number humanity scoreboard and macro proof.",
    route: ROUTES.scoreboard,
    title: "Humanity's Scoreboard",
  },
  tasks: {
    filePath: "packages/web/src/app/tasks/page.tsx",
    purpose: "Highest-value overdue tasks, including leader signatures.",
    route: ROUTES.tasks,
    title: "Tasks",
  },
  taskDetail: {
    filePath: "packages/web/src/app/tasks/[id]/page.tsx",
    purpose: "Task-level evidence, delay math, milestones, and action hooks.",
    route: `${ROUTES.tasks}/[id]`,
    title: "Task Detail",
  },
  video: {
    filePath: "packages/web/src/app/video/page.tsx",
    purpose: "High-compression treaty pitch for sharing.",
    route: ROUTES.video,
    title: "Video",
  },
  wishonia: {
    filePath: "packages/web/src/app/wishonia/page.tsx",
    purpose: "Concrete north-star civilization and institutional endpoint.",
    route: ROUTES.wishonia,
    title: "Wishonia",
  },
};

function growthChildren(parent: TaskTreeNode): TaskTreeNode[] {
  return [
    {
      description:
        `Turn the existing ${CORE_PAGE_CONTEXT.tasks.route} overdue-leader list into a memetic reminder surface with sharper share hooks, politician deep-links, and obvious next actions. Use the actual page instead of inventing new funnel pages.`,
      estimatedEffortHours: 3,
      id: "system_weaponize_overdue_task_list",
      impact: scaleImpact(parent.impact, 0.55),
      isPublic: true,
      roleTitle: "Growth Operator",
      sourceUrls: [
        absoluteUrl(CORE_PAGE_CONTEXT.tasks.route),
        absoluteUrl(CORE_PAGE_CONTEXT.taskDetail.route.replace("[id]", "")),
        absoluteUrl(CORE_PAGE_CONTEXT.politicians.route),
      ],
      status: "DRAFT",
      taskKey: OPTIMIZE_EARTH_WEAPONIZE_OVERDUE_TASK_LIST_KEY,
      title: "Turn the overdue leader task list into a memetic share-and-remind machine",
    },
    {
      description:
        `Exploit the existing ${CORE_PAGE_CONTEXT.governments.route}, ${CORE_PAGE_CONTEXT.politicians.route}, and ${CORE_PAGE_CONTEXT.scoreboard.route} pages as proof assets. Add direct cross-links from leader tasks into politician and scoreboard pages so the outrage has somewhere concrete to go.`,
      estimatedEffortHours: 2,
      id: "system_crosslink_accountability_pages",
      impact: scaleImpact(parent.impact, 0.45),
      isPublic: true,
      roleTitle: "Growth Operator",
      sourceUrls: [
        absoluteUrl(CORE_PAGE_CONTEXT.tasks.route),
        absoluteUrl(CORE_PAGE_CONTEXT.governments.route),
        absoluteUrl(CORE_PAGE_CONTEXT.politicians.route),
        absoluteUrl(CORE_PAGE_CONTEXT.scoreboard.route),
      ],
      status: "DRAFT",
      taskKey: OPTIMIZE_EARTH_CROSSLINK_PAGES_KEY,
      title: "Cross-link task, government, politician, and scoreboard pages into one accountability funnel",
    },
    {
      description:
        `Use the existing ${CORE_PAGE_CONTEXT.video.route}, ${CORE_PAGE_CONTEXT.demo.route}, and ${CORE_PAGE_CONTEXT.wishonia.route} assets as conversion rails. Make the pitch pages feed directly into overdue leader tasks, politician pages, and share actions instead of leaving visitors in explanation land.`,
      estimatedEffortHours: 2,
      id: "system_convert_pitch_pages",
      impact: scaleImpact(parent.impact, 0.4),
      isPublic: true,
      roleTitle: "Growth Operator",
      sourceUrls: [
        absoluteUrl(CORE_PAGE_CONTEXT.video.route),
        absoluteUrl(CORE_PAGE_CONTEXT.demo.route),
        absoluteUrl(CORE_PAGE_CONTEXT.wishonia.route),
        absoluteUrl(CORE_PAGE_CONTEXT.tasks.route),
      ],
      status: "DRAFT",
      taskKey: OPTIMIZE_EARTH_CONVERT_PITCH_PAGES_KEY,
      title: "Turn existing pitch pages into direct traffic for overdue leader and politician tasks",
    },
  ];
}

function contactDiscoveryChildren(parent: TaskTreeNode): TaskTreeNode[] {
  return [
    {
      description:
        "Build missing office-channel discovery tasks for the full signer roster first, especially countries that only have generic government pages or no direct contact URL yet.",
      estimatedEffortHours: 3,
      id: "system_fill_missing_office_channels",
      impact: scaleImpact(parent.impact, 0.55),
      isPublic: true,
      roleTitle: "Outreach Operator",
      sourceUrls: [
        absoluteUrl(CORE_PAGE_CONTEXT.tasks.route),
        absoluteUrl(CORE_PAGE_CONTEXT.governments.route),
      ],
      status: "DRAFT",
      taskKey: OPTIMIZE_EARTH_DISCOVER_OFFICE_CHANNELS_KEY,
      title: "Discover missing office contact channels for the full signer roster",
    },
    {
      description:
        "Create targeted journalist and coalition contact-discovery tasks using the countries already exposed on the public task and politician surfaces, not generic global PR lists.",
      estimatedEffortHours: 2,
      id: "system_targeted_press_and_coalitions",
      impact: scaleImpact(parent.impact, 0.4),
      isPublic: true,
      roleTitle: "Outreach Operator",
      sourceUrls: [
        absoluteUrl(CORE_PAGE_CONTEXT.tasks.route),
        absoluteUrl(CORE_PAGE_CONTEXT.politicians.route),
        absoluteUrl(CORE_PAGE_CONTEXT.scoreboard.route),
      ],
      status: "DRAFT",
      taskKey: OPTIMIZE_EARTH_DISCOVER_PRESS_KEY,
      title: "Discover country-specific journalists and coalition targets from the actual treaty queue",
    },
  ];
}

function systemChildren(parent: TaskTreeNode): TaskTreeNode[] {
  return [
    {
      description:
        "Ground future queue generation in existing public pages, task pages, politician pages, and manual sources so the system proposes leverageable work instead of generic consultant sludge.",
      estimatedEffortHours: 2,
      id: "system_ground_generator_in_existing_assets",
      impact: scaleImpact(parent.impact, 0.5),
      isPublic: true,
      roleTitle: "System Operator",
      sourceUrls: [
        absoluteUrl(CORE_PAGE_CONTEXT.tasks.route),
        absoluteUrl(CORE_PAGE_CONTEXT.governments.route),
        absoluteUrl(CORE_PAGE_CONTEXT.politicians.route),
        absoluteUrl(CORE_PAGE_CONTEXT.video.route),
        absoluteUrl(CORE_PAGE_CONTEXT.wishonia.route),
        "https://manual.warondisease.org",
      ],
      status: "DRAFT",
      taskKey: OPTIMIZE_EARTH_GROUND_GENERATOR_KEY,
      title: "Ground task generation in existing pages and the Wishonia/manual context",
    },
  ];
}

function buildActionRootImpact(input: {
  action: EarthNextActionDecision;
  taskTitle: string;
}): NonNullable<TaskTreeNode["impact"]> {
  const economics = input.action.economics;
  const task = input.action.task;

  return {
    delayDalysLostPerDay:
      task?.impact?.delayDalysLostPerDay ??
      null,
    delayEconomicValueUsdLostPerDay:
      economics?.delayEconomicValueUsdLostPerDay ??
      task?.impact?.delayEconomicValueUsdLostPerDay ??
      null,
    expectedValuePerHourDalys:
      task?.impact?.expectedValuePerHourDalys ??
      null,
    expectedValuePerHourUsd:
      economics?.expectedValuePerHourUsd ??
      task?.impact?.expectedValuePerHourUsd ??
      null,
  };
}

export function buildActionFollowThroughRoots(input: {
  action: EarthNextActionDecision;
}) {
  const task = input.action.task;
  const economics = input.action.economics;
  if (
    !task ||
    (input.action.actionKind !== "FUNDING_UNBLOCKER" &&
      input.action.actionKind !== "PREPARE_PROCUREMENT")
  ) {
    return [] as TaskTreeNode[];
  }
  if (
    typeof task.taskKey === "string" &&
    OPTIMIZE_EARTH_ACTION_FOLLOW_THROUGH_KEY_PREFIXES.some((prefix) =>
      task.taskKey?.startsWith(prefix),
    )
  ) {
    return [] as TaskTreeNode[];
  }

  const taskSlug = slugify(task.taskKey ?? task.title);
  const rootImpact = buildActionRootImpact({
    action: input.action,
    taskTitle: task.title,
  });
  const groundingRefs = Array.from(
    new Set([
      absoluteUrl(CORE_PAGE_CONTEXT.tasks.route),
      absoluteUrl(CORE_PAGE_CONTEXT.scoreboard.route),
      absoluteUrl(CORE_PAGE_CONTEXT.video.route),
      absoluteUrl(CORE_PAGE_CONTEXT.demo.route),
      absoluteUrl(CORE_PAGE_CONTEXT.politicians.route),
      ...((input.action.groundingRefs ?? []).filter(Boolean) as string[]),
      EARTH_OPTIMIZATION_PRIZE_URL,
      INCENTIVE_ALIGNMENT_BONDS_URL,
      EARTH_OPTIMIZATION_PROTOCOL_URL,
    ]),
  );

  const root: TaskTreeNode = {
    description:
      `Unblock ${task.title} by turning the current ${input.action.actionKind.toLowerCase().replace("_", " ")} decision into concrete, grounded funding and procurement work tied to existing Optimitron proof surfaces.`,
    estimatedEffortHours: 1,
    id: `system_action_follow_through_${taskSlug}`,
    impact: rootImpact,
    isPublic: true,
    roleTitle: "System Operator",
    sourceUrls: groundingRefs,
    status: "DRAFT",
    taskKey: buildOptimizeEarthActionFollowThroughKey(taskSlug),
    title: `Unblock funding/procurement for ${task.title}`,
    children: [
      {
        description:
          `Publish a quantified budget and expected-value brief for ${task.title} using the overdue task list, scoreboard, politician pages, and current manual sources. Include the funding gap, the max rational spend, and the exact deliverable being purchased or enabled.`,
        estimatedEffortHours: 2,
        id: `system_publish_budget_brief_${taskSlug}`,
        impact: scaleImpact(rootImpact, 0.45),
        isPublic: true,
        roleTitle: "Funding Operator",
        sourceUrls: [
          absoluteUrl(CORE_PAGE_CONTEXT.tasks.route),
          absoluteUrl(CORE_PAGE_CONTEXT.scoreboard.route),
          absoluteUrl(CORE_PAGE_CONTEXT.politicians.route),
          EARTH_OPTIMIZATION_PRIZE_URL,
          ...(input.action.groundingRefs ?? []),
        ],
        status: "DRAFT",
        taskKey: buildOptimizeEarthPublishBudgetBriefKey(taskSlug),
        title: `Publish the quantified budget brief for ${task.title}`,
      },
      {
        description:
          `Add a direct funding path from existing proof surfaces into ${task.title}. Use the demo, video, overdue task list, and scoreboard pages so visitors can move from "this matters" to "fund this exact bottleneck" without wandering into generic explanation land.`,
        estimatedEffortHours: 3,
        id: `system_route_funding_from_existing_pages_${taskSlug}`,
        impact: scaleImpact(rootImpact, 0.4),
        isPublic: true,
        roleTitle: "Growth Operator",
        sourceUrls: [
          absoluteUrl(CORE_PAGE_CONTEXT.demo.route),
          absoluteUrl(CORE_PAGE_CONTEXT.video.route),
          absoluteUrl(CORE_PAGE_CONTEXT.tasks.route),
          absoluteUrl(CORE_PAGE_CONTEXT.scoreboard.route),
          EARTH_OPTIMIZATION_PRIZE_URL,
        ],
        status: "DRAFT",
        taskKey: buildOptimizeEarthRouteProofPagesKey(taskSlug),
        title: `Route proof-page traffic into funding for ${task.title}`,
      },
      {
        description:
          `Source the cheapest qualified executor for ${task.title}, define the ceiling price, and make the acceptance criteria explicit before any real procurement. Use the current expected-value math and funding gap as the spend boundary.`,
        estimatedEffortHours: 2,
        id: `system_source_counterparties_${taskSlug}`,
        impact: scaleImpact(rootImpact, 0.35),
        isPublic: true,
        roleTitle: "Procurement Operator",
        sourceUrls: [
          absoluteUrl(CORE_PAGE_CONTEXT.tasks.route),
          EARTH_OPTIMIZATION_PROTOCOL_URL,
          INCENTIVE_ALIGNMENT_BONDS_URL,
          ...(input.action.groundingRefs ?? []),
        ],
        status: "DRAFT",
        taskKey: buildOptimizeEarthSourceCounterpartiesKey(taskSlug),
        title: `Source counterparties and set the price ceiling for ${task.title}`,
      },
      {
        description:
          `Prepare the approval packet for ${task.title}: funding gap ${economics?.fundingGapUsd?.toFixed(2) ?? "unknown"} USD, estimated external cost ${economics?.estimatedExternalCostUsd?.toFixed(2) ?? "unknown"} USD, max rational spend ${economics?.maxRationalSpendUsd?.toFixed(2) ?? "unknown"} USD, and the exact pages/evidence that justify paying for it now.`,
        estimatedEffortHours: 1.5,
        id: `system_prepare_approval_packet_${taskSlug}`,
        impact: scaleImpact(rootImpact, 0.3),
        isPublic: true,
        roleTitle: "System Operator",
        sourceUrls: groundingRefs,
        status: "DRAFT",
        taskKey: buildOptimizeEarthPrepareApprovalPacketKey(taskSlug),
        title: `Prepare the approval packet for ${task.title}`,
      },
    ],
  };

  return [root];
}

export function enrichOptimizeEarthBootstrapRoots(roots: TaskTreeNode[]) {
  return roots.map((root) => ({
    ...root,
    children: (root.children ?? []).map((child) => {
      if (child.taskKey === OPTIMIZE_EARTH_GENERATE_GROWTH_TASKS_KEY) {
        return {
          ...child,
          children: growthChildren(child),
        };
      }

      if (child.taskKey === OPTIMIZE_EARTH_GENERATE_CONTACT_DISCOVERY_KEY) {
        return {
          ...child,
          children: contactDiscoveryChildren(child),
        };
      }

      if (child.taskKey === OPTIMIZE_EARTH_GENERATE_SYSTEM_IMPROVEMENT_KEY) {
        return {
          ...child,
          children: systemChildren(child),
        };
      }

      return child;
    }),
  }));
}
