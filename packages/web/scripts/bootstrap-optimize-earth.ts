import "./load-env";

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  type EarthOperatorTask,
  selectNextEarthAction,
  reviewEarthQueueAndBuildSystemImprovements,
  reviewTaskTreeBundle,
  type TaskTreeNode,
} from "@optimitron/agent";
import {
  OrgType,
  SourceArtifactType,
  SourceSystem,
  TaskCategory,
  TaskClaimPolicy,
  TaskDifficulty,
  TaskImpactEstimateKind,
  TaskImpactFrameKey,
  TaskImpactPublicationStatus,
  TaskStatus,
} from "@optimitron/db";
import type { ImportedTaskBundle } from "../src/lib/tasks/opg-obg-adapters";
import { upsertImportedTaskBundle } from "../src/lib/tasks/import-task-bundle.server";
import { prisma } from "../src/lib/prisma";
import * as tasks from "../src/lib/tasks.server";
import {
  buildActionFollowThroughRoots,
  enrichOptimizeEarthBootstrapRoots,
} from "../src/lib/optimize-earth-page-context";
import { enrichTaskTreeWithManualGrounding } from "../src/lib/optimize-earth-grounding.server";
import { getEarthExecutionPolicy } from "../src/lib/tasks/action-policy";
import { TREATY_SIGNER_TASK_KEY_PREFIX } from "../src/lib/tasks/task-keys";
import { getTreatySignerSlots, syncTreatySigners } from "./sync-treaty-signers";

interface ParsedArgs {
  outPath: string | null;
}

function parseArgs(argv: string[]): ParsedArgs {
  let outPath: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--out") {
      outPath = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return { outPath };
}

function toSourceKey(value: string) {
  return value.replace(/[^a-z0-9:-]+/gi, "-").toLowerCase();
}

function inferCategory(node: TaskTreeNode) {
  const taskKey = node.taskKey ?? "";
  const title = node.title.toLowerCase();

  if (
    taskKey.includes("publish-budget-brief") ||
    taskKey.includes("route-proof-pages-into-funding") ||
    title.includes("budget brief") ||
    title.includes("proof-page traffic")
  ) {
    return TaskCategory.COMMUNICATION;
  }

  if (
    taskKey.includes("source-counterparties-and-price-ceiling") ||
    taskKey.includes("prepare-approval-packet") ||
    title.includes("counterparties") ||
    title.includes("approval packet")
  ) {
    return TaskCategory.RESEARCH;
  }

  if (taskKey.includes("growth") || title.includes("website") || title.includes("conversion")) {
    return TaskCategory.COMMUNICATION;
  }

  if (taskKey.includes("contact-discovery") || title.includes("contact-discovery")) {
    return TaskCategory.RESEARCH;
  }

  return TaskCategory.ENGINEERING;
}

function inferDifficulty(node: TaskTreeNode) {
  const effort = node.estimatedEffortHours ?? 0;
  if (effort >= 4) {
    return TaskDifficulty.ADVANCED;
  }
  if (effort >= 2) {
    return TaskDifficulty.INTERMEDIATE;
  }
  return TaskDifficulty.BEGINNER;
}

function inferTags(node: TaskTreeNode) {
  const title = node.title.toLowerCase();
  const taskKey = node.taskKey ?? "";

  if (taskKey.includes("publish-budget-brief") || title.includes("budget brief")) {
    return {
      interestTags: ["funding", "procurement", "systems", "growth"],
      skillTags: ["funding", "research", "policy", "copywriting", "writing"],
    };
  }

  if (taskKey.includes("route-proof-pages-into-funding") || title.includes("proof-page traffic")) {
    return {
      interestTags: ["growth", "funding", "conversion", "distribution"],
      skillTags: ["growth", "copywriting", "typescript", "web-ui", "conversion-rate-optimization"],
    };
  }

  if (taskKey.includes("source-counterparties-and-price-ceiling") || title.includes("counterparties")) {
    return {
      interestTags: ["procurement", "funding", "research"],
      skillTags: ["procurement", "research", "policy", "negotiation"],
    };
  }

  if (taskKey.includes("prepare-approval-packet") || title.includes("approval packet")) {
    return {
      interestTags: ["funding", "systems", "governance"],
      skillTags: ["funding", "policy", "research", "writing"],
    };
  }

  if (taskKey.includes("action-follow-through")) {
    return {
      interestTags: ["funding", "procurement", "systems"],
      skillTags: ["funding", "systems-design", "policy", "research"],
    };
  }

  if (taskKey.includes("expand-treaty-signer-roster")) {
    return {
      interestTags: ["treaty", "queue-quality", "system-improvement"],
      skillTags: ["typescript", "data-pipeline", "task-generation", "policy-analysis"],
    };
  }

  if (taskKey.includes("growth") || title.includes("website") || title.includes("conversion")) {
    return {
      interestTags: ["growth", "conversion", "distribution"],
      skillTags: ["copywriting", "growth", "web-ui", "conversion-rate-optimization"],
    };
  }

  if (taskKey.includes("contact-discovery")) {
    return {
      interestTags: ["outreach", "coalition-building", "journalism"],
      skillTags: ["research", "contact-discovery", "journalism", "organizing"],
    };
  }

  return {
    interestTags: ["optimize-earth", "system-improvement", "task-ranking"],
    skillTags: ["typescript", "systems-design", "task-ranking", "queue-governance"],
  };
}

const ACTION_FOLLOW_THROUGH_TASK_PREFIXES = [
  "system:optimize-earth:action-follow-through:",
  "system:optimize-earth:publish-budget-brief:",
  "system:optimize-earth:route-proof-pages-into-funding:",
  "system:optimize-earth:source-counterparties-and-price-ceiling:",
  "system:optimize-earth:prepare-approval-packet:",
] as const;

const ACTION_FOLLOW_THROUGH_SLUG_STEMS = [
  "system-optimize-earth-action-follow-through-",
  "system-optimize-earth-publish-budget-brief-",
  "system-optimize-earth-route-proof-pages-into-funding-",
  "system-optimize-earth-source-counterparties-and-price-ceiling-",
  "system-optimize-earth-prepare-approval-packet-",
] as const;

function isManualSourceUrl(sourceUrl: string | null | undefined) {
  return typeof sourceUrl === "string" && /^https?:\/\/manual\.warondisease\.org\//i.test(sourceUrl);
}

function classifySourceArtifact(sourceUrl: string | null | undefined) {
  if (!sourceUrl) {
    return {
      artifactType: SourceArtifactType.EXTERNAL_SOURCE,
      sourceSystem: SourceSystem.CURATED,
      sourceUrl: null,
    };
  }

  return isManualSourceUrl(sourceUrl)
    ? {
        artifactType: SourceArtifactType.MANUAL_SECTION,
        sourceSystem: SourceSystem.MANUAL,
        sourceUrl,
      }
    : {
        artifactType: SourceArtifactType.EXTERNAL_SOURCE,
        sourceSystem: SourceSystem.EXTERNAL,
        sourceUrl,
      };
}

function normalizeContextJson(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function getEarthOperatorTasks() {
  const liveTasks = await tasks.listTasks({
    limit: 5000,
    status: TaskStatus.ACTIVE,
    visibility: "public",
  });

  return liveTasks.map(
    (task): EarthOperatorTask => ({
      ...task,
      contextJson: normalizeContextJson(task.contextJson),
    }),
  );
}

function isRecursiveActionFollowThroughTaskKey(taskKey: string | null | undefined) {
  if (!taskKey) {
    return false;
  }

  const matchingPrefix = ACTION_FOLLOW_THROUGH_TASK_PREFIXES.find((prefix) => taskKey.startsWith(prefix));
  if (!matchingPrefix) {
    return false;
  }

  const suffix = taskKey.slice(matchingPrefix.length).toLowerCase();
  return ACTION_FOLLOW_THROUGH_SLUG_STEMS.some((stem) => suffix.includes(stem));
}

function buildSupplementalSourceArtifacts(node: TaskTreeNode, taskKey: string) {
  return (node.sourceUrls ?? []).map((sourceUrl, index) => ({
    ...classifySourceArtifact(sourceUrl),
    contentHash: null,
    externalKey: null,
    payloadJson: {
      taskTreeNodeId: node.id,
    },
    sourceKey: `${isManualSourceUrl(sourceUrl) ? "manual" : "external"}:optimize-earth-bootstrap:${toSourceKey(taskKey)}:${index}`,
    sourceRef: sourceUrl,
    title: `${node.title} source ${index + 1}`,
    versionKey: "current",
  }));
}

function buildImportedTaskBundleFromNode(node: TaskTreeNode): ImportedTaskBundle {
  const estimatedEffortHours = Math.max(node.estimatedEffortHours ?? 1, 0.1);
  const expectedValuePerHourUsd = node.impact?.expectedValuePerHourUsd ?? null;
  const expectedEconomicValueUsdBase =
    expectedValuePerHourUsd == null ? null : expectedValuePerHourUsd * estimatedEffortHours;
  const tags = inferTags(node);
  const taskKey = node.taskKey ?? `system:bootstrap:${toSourceKey(node.id)}`;
  const primarySourceUrl = node.sourceUrls?.[0] ?? null;
  const hasChildren = (node.children?.length ?? 0) > 0;
  const primarySourceArtifact = classifySourceArtifact(primarySourceUrl);

  return {
    impactEstimate: {
      assumptionsJson: {
        bootstrapSource: "optimize-earth-bootstrap",
        taskTreeNodeId: node.id,
      },
      calculationVersion: "optimize-earth-bootstrap-v1",
      counterfactualKey: "current-queue",
      estimateKind: TaskImpactEstimateKind.FORECAST,
      frames: [
        {
          adoptionRampYears: 0,
          annualDiscountRate: 0.03,
          benefitDurationYears: 20,
          customFrameLabel: null,
          delayDalysLostPerDayBase: node.impact?.delayDalysLostPerDay ?? null,
          delayDalysLostPerDayHigh: null,
          delayDalysLostPerDayLow: null,
          delayEconomicValueUsdLostPerDayBase:
            node.impact?.delayEconomicValueUsdLostPerDay ?? null,
          delayEconomicValueUsdLostPerDayHigh: null,
          delayEconomicValueUsdLostPerDayLow: null,
          estimatedCashCostUsdBase: null,
          estimatedCashCostUsdHigh: null,
          estimatedCashCostUsdLow: null,
          estimatedEffortHoursBase: estimatedEffortHours,
          estimatedEffortHoursHigh: null,
          estimatedEffortHoursLow: null,
          evaluationHorizonYears: 20,
          expectedDalysAvertedBase: null,
          expectedDalysAvertedHigh: null,
          expectedDalysAvertedLow: null,
          expectedEconomicValueUsdBase,
          expectedEconomicValueUsdHigh: null,
          expectedEconomicValueUsdLow: null,
          frameKey: TaskImpactFrameKey.TWENTY_YEAR,
          frameSlug: "twenty-year",
          medianHealthyLifeYearsEffectBase: null,
          medianHealthyLifeYearsEffectHigh: null,
          medianHealthyLifeYearsEffectLow: null,
          medianIncomeGrowthEffectPpPerYearBase: null,
          medianIncomeGrowthEffectPpPerYearHigh: null,
          medianIncomeGrowthEffectPpPerYearLow: null,
          metrics: [
            {
              baseValue: node.impact?.delayEconomicValueUsdLostPerDay ?? null,
              displayGroup: "optimize-earth",
              highValue: null,
              lowValue: null,
              metadataJson: {
                displayName: "Delay cost per day",
              },
              metricKey: "delay_economic_value_usd_lost_per_day",
              summaryStatsJson: null,
              unit: "USD/day",
              valueJson: null,
            },
            {
              baseValue: expectedValuePerHourUsd,
              displayGroup: "optimize-earth",
              highValue: null,
              lowValue: null,
              metadataJson: {
                displayName: "Expected value per hour",
              },
              metricKey: "expected_value_per_hour_usd",
              summaryStatsJson: null,
              unit: "USD/hour",
              valueJson: null,
            },
          ],
          successProbabilityBase: 0.6,
          successProbabilityHigh: null,
          successProbabilityLow: null,
          summaryStatsJson: null,
          timeToImpactStartDays: 0,
        },
      ],
      methodologyKey: "optimize-earth-bootstrap",
      parameterSetHash: "sha256:optimize-earth-bootstrap-v1",
      publicationStatus: TaskImpactPublicationStatus.REVIEWED,
      sourceSystem: SourceSystem.MANUAL,
    },
    sourceArtifacts: [
      {
        artifactType: primarySourceArtifact.artifactType,
        contentHash: null,
        externalKey: null,
        payloadJson: {
          taskTreeNodeId: node.id,
          taskTreeTaskKey: taskKey,
        },
        sourceKey: `${primarySourceArtifact.sourceSystem.toLowerCase()}:optimize-earth-bootstrap:${toSourceKey(taskKey)}`,
        sourceRef: primarySourceUrl ?? taskKey,
        sourceSystem: primarySourceArtifact.sourceSystem,
        sourceUrl: primarySourceArtifact.sourceUrl,
        title: `Optimize Earth bootstrap: ${node.title}`,
        versionKey: "v1",
      },
      ...buildSupplementalSourceArtifacts(node, taskKey),
    ],
    task: {
      assigneeAffiliationSnapshot: "Optimize Earth System",
      assigneeOrganizationName: "Optimitron",
      assigneeOrganizationSourceRef: "organization:optimitron",
      assigneeOrganizationType: OrgType.COMPANY,
      category: inferCategory(node),
      claimPolicy: hasChildren ? TaskClaimPolicy.ASSIGNED_ONLY : TaskClaimPolicy.OPEN_MANY,
      contextJson: {
        optimizeEarthBootstrap: true,
        sourceUrls: node.sourceUrls ?? [],
        taskTreeNodeId: node.id,
      },
      contactLabel: null,
      contactTemplate: null,
      contactUrl: node.contactUrl ?? null,
      description:
        node.description ??
        "Repair the Optimize Earth queue so getNextTask surfaces the real frontier.",
      difficulty: inferDifficulty(node),
      dueAt: null,
      estimatedEffortHours,
      impactStatement: node.description ?? node.title,
      interestTags: tags.interestTags,
      roleTitle: node.roleTitle ?? "System Operator",
      skillTags: tags.skillTags,
      status: TaskStatus.ACTIVE,
      taskKey,
      title: node.title,
    },
  };
}

async function syncSystemTaskNode(
  node: TaskTreeNode,
  parentTaskId: string | null,
  promotableRefs: Set<string>,
  results: Array<{ taskId: string; taskKey: string; title: string }>,
) {
  if (!promotableRefs.has(node.id)) {
    const existingTask = await prisma.task.findFirst({
      where: {
        deletedAt: null,
        ...(node.taskKey
          ? {
              taskKey: node.taskKey,
            }
          : {
              parentTaskId,
              title: node.title,
            }),
      },
      select: {
        id: true,
      },
    });

    if (!existingTask) {
      return;
    }

    if (node.taskKey?.trim()) {
      const bundle = buildImportedTaskBundleFromNode(node);
      const result = await upsertImportedTaskBundle(bundle, {
        isPublic: node.isPublic !== false,
        parentTaskId,
      });

      results.push({
        taskId: result.taskId,
        taskKey: result.taskKey,
        title: bundle.task.title,
      });
    }

    for (const child of node.children ?? []) {
      await syncSystemTaskNode(child, existingTask.id, promotableRefs, results);
    }
    return;
  }

  const bundle = buildImportedTaskBundleFromNode(node);
  const result = await upsertImportedTaskBundle(bundle, {
    isPublic: node.isPublic !== false,
    parentTaskId,
  });

  results.push({
    taskId: result.taskId,
    taskKey: result.taskKey,
    title: bundle.task.title,
  });

  for (const child of node.children ?? []) {
    await syncSystemTaskNode(child, result.taskId, promotableRefs, results);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const recursiveActionFollowThroughTasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      isPublic: true,
      status: TaskStatus.ACTIVE,
      taskKey: {
        startsWith: "system:optimize-earth:",
      },
    },
    select: {
      id: true,
      taskKey: true,
    },
  });
  const recursiveActionFollowThroughTaskIds = recursiveActionFollowThroughTasks
    .filter((task) => isRecursiveActionFollowThroughTaskKey(task.taskKey))
    .map((task) => task.id);

  if (recursiveActionFollowThroughTaskIds.length > 0) {
    await prisma.task.updateMany({
      where: {
        id: {
          in: recursiveActionFollowThroughTaskIds,
        },
      },
      data: {
        status: TaskStatus.STALE,
      },
    });
  }

  const targetSignerCount = getTreatySignerSlots().length;
  const existingSignerCount = await prisma.task.count({
    where: {
      deletedAt: null,
      taskKey: {
        startsWith: `${TREATY_SIGNER_TASK_KEY_PREFIX}:`,
      },
    },
  });

  if (existingSignerCount < targetSignerCount) {
    await syncTreatySigners({
      countryCodes: null,
      importDb: true,
      printJson: false,
    });
  }

  const liveTasks = await getEarthOperatorTasks();
  const review = reviewEarthQueueAndBuildSystemImprovements(liveTasks);
  const reviewedRoots = await enrichTaskTreeWithManualGrounding(
    enrichOptimizeEarthBootstrapRoots(review.roots),
  );
  const enrichedReview = reviewTaskTreeBundle({
    existingTasks: liveTasks.map((task) => ({
      assigneeOrganizationId: task.assigneeOrganization?.id ?? null,
      assigneePersonId: task.assigneePerson?.id ?? null,
      id: task.id,
      roleTitle: task.roleTitle ?? null,
      status: task.status,
      taskKey: task.taskKey ?? null,
      title: task.title,
    })),
    roots: reviewedRoots,
  });
  const promotableRefs = new Set(
    enrichedReview.review.decisions
      .filter((decision) => decision.promotable)
      .map((decision) => decision.proposalRef),
  );

  const importedSystemTasks: Array<{ taskId: string; taskKey: string; title: string }> = [];
  for (const root of reviewedRoots) {
    await syncSystemTaskNode(root, null, promotableRefs, importedSystemTasks);
  }

  const finalLiveTasks = await getEarthOperatorTasks();
  const nextActionBeforeFollowThrough = selectNextEarthAction({
    agent: {
      availableHoursPerWeek: 10,
      interestTags: ["growth", "governance", "systems", "funding", "procurement"],
      maxTaskDifficulty: "ADVANCED",
      skillTags: ["typescript", "growth", "research", "policy", "funding", "procurement"],
    },
    policy: getEarthExecutionPolicy(),
    tasks: finalLiveTasks,
  });
  const actionFollowThroughRoots = await enrichTaskTreeWithManualGrounding(
    buildActionFollowThroughRoots({
      action: nextActionBeforeFollowThrough,
    }),
  );
  const actionFollowThroughReview =
    actionFollowThroughRoots.length === 0
      ? null
      : reviewTaskTreeBundle({
          existingTasks: finalLiveTasks.map((task) => ({
            assigneeOrganizationId: task.assigneeOrganization?.id ?? null,
            assigneePersonId: task.assigneePerson?.id ?? null,
            id: task.id,
            roleTitle: task.roleTitle ?? null,
            status: task.status,
            taskKey: task.taskKey ?? null,
            title: task.title,
          })),
          roots: actionFollowThroughRoots,
        });
  const actionFollowThroughPromotableRefs = new Set(
    actionFollowThroughReview?.review.decisions
      .filter((decision) => decision.promotable)
      .map((decision) => decision.proposalRef) ?? [],
  );
  const importedActionFollowThroughTasks: Array<{ taskId: string; taskKey: string; title: string }> = [];
  for (const root of actionFollowThroughRoots) {
    await syncSystemTaskNode(root, null, actionFollowThroughPromotableRefs, importedActionFollowThroughTasks);
  }

  const finalTasksAfterFollowThrough = await getEarthOperatorTasks();
  const finalReview = reviewEarthQueueAndBuildSystemImprovements(finalTasksAfterFollowThrough);
  const nextActionAfterFollowThrough = selectNextEarthAction({
    agent: {
      availableHoursPerWeek: 10,
      interestTags: ["growth", "governance", "systems", "funding", "procurement"],
      maxTaskDifficulty: "ADVANCED",
      skillTags: ["typescript", "growth", "research", "policy", "funding", "procurement"],
    },
    policy: getEarthExecutionPolicy(),
    tasks: finalTasksAfterFollowThrough,
  });

  const [activePublicTaskCount, treatySignerCount] = await Promise.all([
    prisma.task.count({
      where: {
        deletedAt: null,
        isPublic: true,
        status: TaskStatus.ACTIVE,
      },
    }),
    prisma.task.count({
      where: {
        deletedAt: null,
        isPublic: true,
        status: TaskStatus.ACTIVE,
        taskKey: {
          startsWith: `${TREATY_SIGNER_TASK_KEY_PREFIX}:`,
        },
      },
    }),
  ]);

  const summary = {
    activePublicTaskCount,
    actionFollowThroughSummary: actionFollowThroughReview?.review.summary ?? null,
    existingSignerCount,
    nextActionAfterFollowThrough: {
      actionKind: nextActionAfterFollowThrough.actionKind,
      requiredApproval: nextActionAfterFollowThrough.requiredApproval,
      taskKey: nextActionAfterFollowThrough.task?.taskKey ?? null,
      title: nextActionAfterFollowThrough.task?.title ?? null,
    },
    nextActionBeforeFollowThrough: {
      actionKind: nextActionBeforeFollowThrough.actionKind,
      requiredApproval: nextActionBeforeFollowThrough.requiredApproval,
      taskKey: nextActionBeforeFollowThrough.task?.taskKey ?? null,
      title: nextActionBeforeFollowThrough.task?.title ?? null,
    },
    promotableSystemTaskCount: enrichedReview.review.promotableCount,
    promotableActionFollowThroughCount: actionFollowThroughReview?.review.promotableCount ?? 0,
    queueAuditIssues: finalReview.audit.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      severity: issue.severity,
    })),
    reviewedSystemSummary: finalReview.proposal.review.summary,
    syncedActionFollowThroughTasks: importedActionFollowThroughTasks,
    syncedSystemTasks: importedSystemTasks,
    targetSignerCount,
    treatySignerCount,
  };

  if (args.outPath) {
    const outputPath = resolve(process.cwd(), args.outPath);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    console.log(`Wrote optimize-earth bootstrap summary to ${outputPath}`);
    return;
  }

  console.log(JSON.stringify(summary, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
