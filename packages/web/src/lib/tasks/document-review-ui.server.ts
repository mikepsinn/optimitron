import { listDocumentsForViewer } from "@/lib/documents.server";
import {
  getDocumentReviewPanelData,
  type DocumentReviewPanelData,
} from "@/lib/tasks/document-review.server";

export interface DocumentReviewSetupDocument {
  revisionId: string;
  title: string;
  version: number;
}

export interface DocumentReviewManagerSetupData {
  documents: DocumentReviewSetupDocument[];
}

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

  const summaries = await listDocumentsForViewer({
    limit: 100,
    taskId: panel.authorityTaskId,
    userId,
  });
  const documents = summaries.flatMap((summary) => {
    if (!summary.revisionId) return [];
    return [
      {
        revisionId: summary.revisionId,
        title: summary.title,
        version: summary.version,
      },
    ];
  });

  return { panel, setup: { documents } };
}
