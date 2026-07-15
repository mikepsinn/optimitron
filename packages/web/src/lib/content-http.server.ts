import { NextResponse } from "next/server";

const NOT_FOUND_MESSAGES = new Set([
  "Collection not found",
  "Content not found",
  "Document not found",
]);

const VALIDATION_MESSAGE_PARTS = [
  "at least one",
  "cannot make",
  "cannot be empty",
  "character",
  "configured option",
  "contains an unknown",
  "exactly one",
  "field key",
  "field name",
  "is read-only",
  "is required",
  "must be",
  "no optimitron account",
  "requires",
  "unknown field",
  "unknown filter",
  "unknown relation",
  "unknown sort",
];

export function noStoreJson(
  body: unknown,
  init?: { status?: number },
): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export function parseOptionalPositiveInteger(
  value: string | null,
  name: string,
): number | undefined {
  if (value === null) return undefined;
  if (!/^\d+$/u.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

export function contentErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof Error)) return null;
  if (error.name === "ZodError") {
    const rawIssues = (error as Error & { issues?: unknown }).issues;
    const issues = Array.isArray(rawIssues)
      ? rawIssues.flatMap((issue) => {
          if (!issue || typeof issue !== "object" || Array.isArray(issue)) {
            return [];
          }
          const row = issue as {
            code?: unknown;
            message?: unknown;
            path?: unknown;
          };
          if (typeof row.message !== "string") return [];
          return [
            {
              code: typeof row.code === "string" ? row.code : "custom",
              message: row.message,
              path: Array.isArray(row.path)
                ? row.path.filter(
                    (part): part is number | string =>
                      typeof part === "number" || typeof part === "string",
                  )
                : [],
            },
          ];
        })
      : [];
    return noStoreJson(
      {
        code: "VALIDATION_ERROR",
        error: "Invalid content request.",
        issues,
      },
      { status: 400 },
    );
  }
  if (error.message === "Unauthorized") {
    return noStoreJson(
      { code: "UNAUTHORIZED", error: "Unauthorized" },
      { status: 401 },
    );
  }
  if (NOT_FOUND_MESSAGES.has(error.message)) {
    return noStoreJson(
      { code: "CONTENT_NOT_FOUND", error: "Content not found." },
      { status: 404 },
    );
  }
  if (
    error.message.includes("changed since it was loaded") ||
    error.message.includes("idempotency key was already used")
  ) {
    return noStoreJson(
      { code: "CONFLICT", error: error.message },
      { status: 409 },
    );
  }
  const normalized = error.message.toLocaleLowerCase();
  if (VALIDATION_MESSAGE_PARTS.some((part) => normalized.includes(part))) {
    return noStoreJson(
      { code: "VALIDATION_ERROR", error: error.message },
      { status: 400 },
    );
  }
  return null;
}
