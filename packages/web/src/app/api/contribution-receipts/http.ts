import { z } from "zod";
import { noStoreJson } from "@/lib/content-http.server";

export function contributionReceiptErrorResponse(
  error: unknown,
  fallback: string,
) {
  if (error instanceof Error && error.message === "Unauthorized") {
    return noStoreJson({ error: "Authentication required." }, { status: 401 });
  }
  if (error instanceof z.ZodError) {
    return noStoreJson(
      { error: error.issues[0]?.message ?? "Invalid receipt request." },
      { status: 400 },
    );
  }
  if (
    error instanceof Error &&
    (error.message.includes("not found") ||
      error.message.includes("not accessible"))
  ) {
    return noStoreJson(
      { error: "Contribution receipt not found." },
      { status: 404 },
    );
  }
  if (error instanceof Error) {
    return noStoreJson({ error: error.message }, { status: 409 });
  }
  console.error("[CONTRIBUTION_RECEIPT] Request failed:", error);
  return noStoreJson({ error: fallback }, { status: 500 });
}
