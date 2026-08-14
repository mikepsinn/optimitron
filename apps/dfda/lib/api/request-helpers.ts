/** Request/response helpers shared by the REST v1 tracking routes. */
import { NextResponse } from "next/server";

/**
 * Tracking core functions throw Error with a caller-actionable message on
 * invalid input; map those to 400. Anything else is a server fault: log it
 * and return a generic 500.
 */
export function trackingErrorResponse(
  error: unknown,
  context: string,
): NextResponse {
  if (error instanceof Error) {
    return NextResponse.json(
      { error: { code: "invalid_argument", message: error.message } },
      { status: 400 },
    );
  }
  console.error(`[dfda-api] ${context} failed:`, error);
  return NextResponse.json(
    {
      error: {
        code: "internal",
        message: "Request failed. See server logs for details.",
      },
    },
    { status: 500 },
  );
}

/** Parse a JSON object body. Throws Error (→ 400) on anything else. */
export async function readJsonObject(
  req: Request,
): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

/**
 * Build a tracking-core input object from query params. Absent params stay
 * absent. Numbers pass through Number() so the core parse helpers report
 * the field-specific error for non-numeric values.
 */
export function queryInput(
  url: URL,
  fields: { booleans?: string[]; numbers?: string[]; strings?: string[] },
): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const name of fields.strings ?? []) {
    const value = url.searchParams.get(name);
    if (value !== null && value !== "") input[name] = value;
  }
  for (const name of fields.numbers ?? []) {
    const value = url.searchParams.get(name);
    if (value !== null && value !== "") input[name] = Number(value);
  }
  for (const name of fields.booleans ?? []) {
    const value = url.searchParams.get(name);
    if (value !== null) input[name] = value === "true" || value === "1";
  }
  return input;
}
