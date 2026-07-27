import { TaskCandidateMatchStatus } from "@optimitron/db/enums";
import {
  getDocumentForViewer,
  listDocumentsForViewer,
} from "@/lib/documents.server";
import { prisma } from "@/lib/prisma";
import type { DocumentDecisionV1 } from "@/lib/tasks/document-review-contracts";
import {
  getDocumentReviewPanelData,
  type DocumentReviewPanelData,
} from "@/lib/tasks/document-review.server";
import {
  readTaskCandidateEvidence,
  type TaskCandidateEvidenceV1,
} from "@/lib/tasks/task-candidate-evidence";

export interface DocumentReviewSetupDocument {
  contentHash: string;
  documentId: string;
  revisionId: string;
  title: string;
  version: number;
}

export interface DocumentReviewSetupCandidate {
  displayName: string;
  email: string | null;
  evidence: TaskCandidateEvidenceV1 | null;
  matchId: string;
  personId: string;
  score: number;
  status: TaskCandidateMatchStatus;
}

export interface DocumentReviewManagerSetupData {
  candidates: DocumentReviewSetupCandidate[];
  decisions: Array<DocumentDecisionV1 & { artifactId: string }>;
  documents: DocumentReviewSetupDocument[];
}

/**
 * Manager-only setup data for the generic document-review panel. The review
 * service is the authorization gate; direct queries below only run after it
 * confirms MANAGE access to the authority task.
 */
export async function getDocumentReviewPageData(
  taskId: string,
  userId: string,
): Promise<{
  panel: DocumentReviewPanelData;
  setup: DocumentReviewManagerSetupData | null;
} | null> {
  const panel = await getDocumentReviewPanelData(taskId, userId);
  if (!panel) return null;
  if (panel.mode === "REVIEWER") return { panel, setup: null };

  const authorityTaskId = panel.authorityTaskId;
  const [summaries, matches] = await Promise.all([
    listDocumentsForViewer({
      limit: 100,
      taskId: authorityTaskId,
      userId,
    }),
    prisma.taskCandidateMatch.findMany({
      where: {
        deletedAt: null,
        status: {
          in: [
            TaskCandidateMatchStatus.SUGGESTED,
            TaskCandidateMatchStatus.CONTACTED,
          ],
        },
        taskId: authorityTaskId,
      },
      orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
      select: {
        candidatePerson: {
          select: { displayName: true, email: true, id: true },
        },
        candidateUser: {
          select: {
            person: {
              select: { displayName: true, email: true, id: true },
            },
          },
        },
        id: true,
        reasonJson: true,
        score: true,
        status: true,
      },
      take: 200,
    }),
  ]);

  const documentViews = await Promise.all(
    summaries.map((summary) => getDocumentForViewer(summary.id, userId)),
  );
  const documents = documentViews.flatMap((view) => {
    const contentHash = view?.revision.contentHash;
    if (!view || !contentHash) return [];
    return [
      {
        contentHash,
        documentId: view.document.id,
        revisionId: view.revision.id,
        title: view.revision.title,
        version: view.revision.version,
      },
    ];
  });

  const seenPeople = new Set<string>();
  const candidates = matches.flatMap((match) => {
    const person = match.candidatePerson ?? match.candidateUser?.person ?? null;
    if (!person || seenPeople.has(person.id)) return [];
    seenPeople.add(person.id);
    return [
      {
        displayName: person.displayName,
        email: person.email,
        evidence: readTaskCandidateEvidence(match.reasonJson),
        matchId: match.id,
        personId: person.id,
        score: match.score,
        status: match.status,
      },
    ];
  });

  const decisions = panel.decisions.map(({ artifactId, decision }) => ({
    ...decision,
    artifactId,
  }));

  return { panel, setup: { candidates, decisions, documents } };
}
