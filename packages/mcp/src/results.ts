export function mcpResult(data: unknown) {
  const text =
    JSON.stringify(
      data,
      (_key, value: unknown) => {
        if (typeof value !== "bigint") return value;
        const number = Number(value);
        return Number.isSafeInteger(number) ? number : value.toString();
      },
      2,
    ) ?? "null";
  const json: unknown = JSON.parse(text);
  return {
    content: [{ type: "text" as const, text }],
    ...(json != null && typeof json === "object" && !Array.isArray(json)
      ? { structuredContent: json as Record<string, unknown> }
      : {}),
  };
}

export function mcpError(
  message: string,
  code = "INVALID_ARGUMENT",
  details?: Record<string, unknown>,
) {
  const payload = {
    ok: false,
    errorCode: code,
    message,
    retryable: false,
    ...(details ? { details } : {}),
  };
  return { ...mcpResult(payload), isError: true };
}
