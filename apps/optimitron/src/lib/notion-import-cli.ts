/** Remote writes must run inside the deployed app so its caches are invalidated. */
export function assertLocalNotionImportApply(apply: boolean, databaseUrl?: string) {
  if (!apply) return;

  try {
    const url = new URL(databaseUrl ?? "");
    if (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      ["localhost", "127.0.0.1", "[::1]", "host.docker.internal"].includes(url.hostname)
    ) return;
  } catch {
    // Never include connection credentials in the error.
  }

  throw new Error(
    "Direct --apply imports require a local database. Use the authenticated " +
    "importNotionBundle MCP tool on the target deployment for remote imports " +
    "so public task caches are invalidated with the writes.",
  );
}
