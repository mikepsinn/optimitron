import { z } from "zod";
import { noStoreJson } from "@/lib/content-http.server";
import { DocumentReviewError } from "@/lib/tasks/document-review.server";

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
  if (error instanceof DocumentReviewError) {
    return noStoreJson(
      { code: error.code, error: error.message },
      { status: error.status },
    );
  }
  console.error("[DOCUMENT_REVIEW] Request failed:", error);
  return noStoreJson(
    { code: "INTERNAL_ERROR", error: fallbackMessage },
    { status: 500 },
  );
}
