import {
  TaskCandidateMatchStatus,
  TaskImpactPublicationStatus,
  TaskStatus,
} from "@optimitron/db/enums";
import { auditTaskTree } from "./task-tree-steward";

export async function loadTaskTreeAudit(input: {
  cursor?: string | null;
  limit?: number;
  rootTaskId?: string;
}) {
  const { prisma } = await import("../prisma");
  const [tasks, edges] = await Promise.all([
    prisma.task.findMany({
      where: { deletedAt: null },
      orderBy: { id: "asc" },
      select: {
        assigneeOrganizationId: true,
        assigneePersonId: true,
        candidateMatches: {
          where: {
            deletedAt: null,
            status: {
              in: [
                TaskCandidateMatchStatus.SUGGESTED,
                TaskCandidateMatchStatus.CONTACTED,
              ],
            },
          },
          select: { id: true },
        },
        category: true,
        childTasks: {
          where: { deletedAt: null, status: TaskStatus.ACTIVE },
          select: { id: true },
        },
        claimPolicy: true,
        communicationEndpoints: {
          where: { deletedAt: null, sourceUrl: { not: null } },
          select: { sourceUrl: true },
        },
        contextJson: true,
        currentImpactEstimateSet: {
          select: { id: true, publicationStatus: true },
        },
        description: true,
        estimatedEffortHours: true,
        executionMode: true,
        id: true,
        isPublic: true,
        parentTaskId: true,
        preferredSkillTags: true,
        requiredAccessTags: true,
        requiredCredentialTags: true,
        requiredToolTags: true,
        roleTitle: true,
        skillTags: true,
        sourceArtifacts: {
          where: { deletedAt: null },
          select: { id: true },
        },
        status: true,
        taskKey: true,
        title: true,
      },
    }),
    prisma.taskEdge.findMany({
      where: {
        deletedAt: null,
        fromTask: { deletedAt: null },
        toTask: { deletedAt: null },
      },
      orderBy: { id: "asc" },
      select: {
        edgeType: true,
        fromTaskId: true,
        probabilityDeltaBase: true,
        timeDeltaDaysBase: true,
        toTaskId: true,
      },
    }),
  ]);

  return auditTaskTree({
    ...input,
    edges,
    tasks: tasks.map((task) => ({
      activeChildTaskCount: task.childTasks.length,
      activeCandidateMatchCount: task.candidateMatches.length,
      assigneeOrganizationId: task.assigneeOrganizationId,
      assigneePersonId: task.assigneePersonId,
      category: task.category,
      claimPolicy: task.claimPolicy,
      contextJson: task.contextJson,
      description: task.description,
      estimatePublicationEligible:
        !task.isPublic ||
        task.currentImpactEstimateSet?.publicationStatus ===
          TaskImpactPublicationStatus.REVIEWED ||
        task.currentImpactEstimateSet?.publicationStatus ===
          TaskImpactPublicationStatus.PUBLISHED,
      estimatedEffortHours: task.estimatedEffortHours,
      executionMode: task.executionMode,
      hasMarginalEstimate: task.currentImpactEstimateSet != null,
      hasSourceUrl: task.communicationEndpoints.some((endpoint) =>
        Boolean(endpoint.sourceUrl?.trim()),
      ),
      id: task.id,
      isPublic: task.isPublic,
      parentTaskId: task.parentTaskId,
      preferredSkillTags: task.preferredSkillTags,
      requiredAccessTags: task.requiredAccessTags,
      requiredCredentialTags: task.requiredCredentialTags,
      requiredToolTags: task.requiredToolTags,
      roleTitle: task.roleTitle,
      skillTags: task.skillTags,
      sourceArtifactCount: task.sourceArtifacts.length,
      status: task.status,
      taskKey: task.taskKey,
      title: task.title,
    })),
  });
}
