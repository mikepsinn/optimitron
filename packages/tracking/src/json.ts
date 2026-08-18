// Mirrors apps/optimitron/src/lib/json-safe.ts: Prisma rows carry BigInt columns
// and bare JSON.stringify throws on them.
export function jsonSafeReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
  }
  return value;
}

export function stringifyJsonSafe(data: unknown, space?: number): string {
  return JSON.stringify(data, jsonSafeReplacer, space) ?? "null";
}
