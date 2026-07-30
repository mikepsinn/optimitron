import { z } from "zod";
import { requireTaskRequestAuth } from "@/lib/auth-utils";
import { noStoreJson } from "@/lib/content-http.server";
import type { TaskClientAccessBoundary } from "@/lib/tasks/task-visibility.server";

type DocumentReviewOperation = (
  authorityTaskId: string,
  rawInput: unknown,
  actorUserId: string,
  options: {
    clientAccessBoundary?: TaskClientAccessBoundary;
    idempotencyKey: string;
  },
) => Promise<unknown>;

type DocumentReviewReadOperation = (
  reviewTaskId: string,
  actorUserId: string,
  options: {
    clientAccessBoundary?: TaskClientAccessBoundary;
  },
) => Promise<unknown>;

interface ReviewHttpError {
  code?: unknown;
  message?: unknown;
  status?: unknown;
}

export async function runDocumentReviewOperation(
  request: Request,
  context: { params: Promise<{ id: string }> },
  operation: DocumentReviewOperation,
  fallbackMessage: string,
) {
  try {
    const { clientAccessBoundary, userId } =
      await requireTaskRequestAuth(request);
    const { id } = await context.params;
    const result = await operation(
      id,
      await request.json().catch(() => null),
      userId,
      {
        clientAccessBoundary,
        idempotencyKey: request.headers.get("Idempotency-Key") ?? "",
      },
    );
    return noStoreJson(result, { status: 201 });
  } catch (error) {
    return documentReviewErrorResponse(error, fallbackMessage);
  }
}

export async function runDocumentReviewRead(
  request: Request,
  context: { params: Promise<{ id: string }> },
  operation: DocumentReviewReadOperation,
  fallbackMessage: string,
) {
  try {
    const { clientAccessBoundary, userId } =
      await requireTaskRequestAuth(request);
    const { id } = await context.params;
    const result = await operation(id, userId, { clientAccessBoundary });
    return noStoreJson(result);
  } catch (error) {
    return documentReviewErrorResponse(error, fallbackMessage);
  }
}

export function documentReviewErrorResponse(
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof Error && error.message === "Unauthorized") {
    return noStoreJson(
      { code: "UNAUTHORIZED", error: "Authentication required." },
      { status: 401 },
    );
  }
  if (error instanceof z.ZodError) {
    return noStoreJson(
      {
        code: "VALIDATION_ERROR",
        error: error.issues[0]?.message ?? "Invalid document review request.",
      },
      { status: 400 },
    );
  }
  const candidate = error as ReviewHttpError | null;
  if (
    candidate &&
    typeof candidate.message === "string" &&
    typeof candidate.status === "number" &&
    [400, 404, 409].includes(candidate.status)
  ) {
    return noStoreJson(
      {
        code:
          typeof candidate.code === "string"
            ? candidate.code
            : "DOCUMENT_REVIEW_ERROR",
        error: candidate.message,
      },
      { status: candidate.status },
    );
  }
  console.error("[DOCUMENT_REVIEW] Request failed:", error);
  return noStoreJson(
    { code: "INTERNAL_ERROR", error: fallbackMessage },
    { status: 500 },
  );
}
