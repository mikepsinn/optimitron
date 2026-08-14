// Input-parsing helpers shared by the tracking tools and the wider
// optimitron MCP server (packages/web imports these back from here).

export function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function optionalStringInput(
  input: Record<string, unknown>,
  fieldName: string,
) {
  if (!(fieldName in input)) return undefined;
  const value = input[fieldName];
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string or null.`);
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function isPrismaUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error != null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export function parseEnumInput<T extends Record<string, string>>(
  values: T,
  value: unknown,
  fieldName: string,
): T[keyof T] | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, "_");
  const parsed = values[normalized as keyof T];
  if (!parsed) {
    throw new Error(
      `${fieldName} must be one of: ${Object.keys(values).join(", ")}.`,
    );
  }
  return parsed;
}

export function parseOptionalFiniteNumberInput(
  input: Record<string, unknown>,
  fieldName: string,
) {
  if (!(fieldName in input)) return undefined;
  const value = input[fieldName];
  if (value == null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number or null.`);
  }
  return value;
}
