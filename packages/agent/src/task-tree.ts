import { z } from 'zod';
import {
  ExistingTaskSummarySchema,
  TaskProposalImpactSchema,
  reviewTaskProposalBundle,
  type ExistingTaskSummary,
  type TaskBundleReview,
  type TaskProposalCandidate,
  type TaskProposalImpact,
} from './task-governance.js';

export interface TaskTreeNode {
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  blockerRefs?: string[];
  children?: TaskTreeNode[];
  contactUrl?: string | null;
  description?: string | null;
  estimatedEffortHours?: number | null;
  id: string;
  impact?: TaskProposalImpact | null;
  isPublic?: boolean | null;
  roleTitle?: string | null;
  sourceUrls?: string[];
  status?: string | null;
  taskKey?: string | null;
  title: string;
}

export interface TaskTreeSummary {
  leafCount: number;
  deepestLevel: number;
  nodeCount: number;
  publicCount: number;
  rootCount: number;
}

export interface TaskTreeReview {
  candidates: TaskProposalCandidate[];
  review: TaskBundleReview;
  summary: TaskTreeSummary;
}

export const TaskTreeNodeSchema: z.ZodType<TaskTreeNode> = z.lazy(() =>
  z.object({
    assigneeOrganizationId: z.string().nullable().optional(),
    assigneePersonId: z.string().nullable().optional(),
    blockerRefs: z.array(z.string().min(1)).optional(),
    children: z.array(TaskTreeNodeSchema).optional(),
    contactUrl: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    estimatedEffortHours: z.number().nullable().optional(),
    id: z.string().min(1),
    impact: TaskProposalImpactSchema.nullable().optional(),
    isPublic: z.boolean().nullable().optional(),
    roleTitle: z.string().nullable().optional(),
    sourceUrls: z.array(z.string().min(1)).optional(),
    status: z.string().nullable().optional(),
    taskKey: z.string().nullable().optional(),
    title: z.string().min(1),
  }),
);

export const TaskTreeBundleSchema = z.object({
  existingTasks: z.array(ExistingTaskSummarySchema).optional(),
  roots: z.array(TaskTreeNodeSchema).min(1),
});

function flattenNodes(
  nodes: TaskTreeNode[],
  parentTaskRef: string | null,
  seenIds: Set<string>,
  output: TaskProposalCandidate[],
) {
  for (const node of nodes) {
    if (seenIds.has(node.id)) {
      throw new Error(`Duplicate task-tree node id "${node.id}".`);
    }
    seenIds.add(node.id);

    output.push({
      assigneeOrganizationId: node.assigneeOrganizationId ?? null,
      assigneePersonId: node.assigneePersonId ?? null,
      blockerRefs: node.blockerRefs ?? [],
      contactUrl: node.contactUrl ?? null,
      description: node.description ?? null,
      estimatedEffortHours: node.estimatedEffortHours ?? null,
      id: node.id,
      impact: node.impact ?? null,
      isPublic: node.isPublic ?? true,
      parentTaskRef,
      roleTitle: node.roleTitle ?? null,
      sourceUrls: node.sourceUrls ?? [],
      status: node.status ?? 'DRAFT',
      taskKey: node.taskKey ?? null,
      title: node.title,
    });

    flattenNodes(node.children ?? [], node.id, seenIds, output);
  }
}

function summarizeNodes(nodes: TaskTreeNode[], depth: number): TaskTreeSummary {
  let nodeCount = 0;
  let leafCount = 0;
  let publicCount = 0;
  let deepestLevel = depth;

  for (const node of nodes) {
    nodeCount += 1;
    if ((node.isPublic ?? true) === true) {
      publicCount += 1;
    }

    const children = node.children ?? [];
    if (children.length === 0) {
      leafCount += 1;
      deepestLevel = Math.max(deepestLevel, depth);
      continue;
    }

    const childSummary = summarizeNodes(children, depth + 1);
    nodeCount += childSummary.nodeCount;
    leafCount += childSummary.leafCount;
    publicCount += childSummary.publicCount;
    deepestLevel = Math.max(deepestLevel, childSummary.deepestLevel);
  }

  return {
    leafCount,
    deepestLevel,
    nodeCount,
    publicCount,
    rootCount: nodes.length,
  };
}

export function compileTaskTreeBundle(input: { roots: TaskTreeNode[] }) {
  const parsed = TaskTreeBundleSchema.pick({ roots: true }).parse(input);
  const candidates: TaskProposalCandidate[] = [];
  flattenNodes(parsed.roots, null, new Set<string>(), candidates);
  return candidates;
}

export function summarizeTaskTree(roots: TaskTreeNode[]) {
  const parsedRoots = TaskTreeBundleSchema.pick({ roots: true }).parse({ roots }).roots;
  return summarizeNodes(parsedRoots, 1);
}

export function reviewTaskTreeBundle(input: {
  existingTasks?: ExistingTaskSummary[];
  roots: TaskTreeNode[];
}): TaskTreeReview {
  const parsed = TaskTreeBundleSchema.parse(input);
  const candidates = compileTaskTreeBundle({ roots: parsed.roots });
  const review = reviewTaskProposalBundle({
    candidates,
    existingTasks: parsed.existingTasks,
  });

  return {
    candidates,
    review,
    summary: summarizeTaskTree(parsed.roots),
  };
}
