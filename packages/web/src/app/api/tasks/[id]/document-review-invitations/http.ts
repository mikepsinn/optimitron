import { z } from "zod";
import { noStoreJson } from "@/lib/content-http.server";

export function reviewInvitationErrorResponse(
  error: unknown,
  fallback: string,
) {
  if (error instanceof Error && error.message === "Unauthorized") {
    return noStoreJson({ error: "Authentication required." }, { status: 401 });
  }
  if (error instanceof z.ZodError) {
    return noStoreJson(
      { error: error.issues[0]?.message ?? "Invalid invitation request." },
      { status: 400 },
    );
  }
  if (
    error instanceof Error &&
    (error.message === "Task not found" ||
      error.message === "Outbound message batch not found")
  ) {
    return noStoreJson(
      { error: "Review invitation not found." },
      { status: 404 },
    );
  }
  if (error instanceof Error) {
    return noStoreJson({ error: error.message }, { status: 409 });
  }
  console.error("[DOCUMENT_REVIEW_INVITATION] Request failed:", error);
  return noStoreJson({ error: fallback }, { status: 500 });
}
