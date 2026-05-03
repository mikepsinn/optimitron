export function renderTemplate(
  template: string,
  tokens: Record<string, string | number | null | undefined>,
  options: { missingToken?: "throw" | "empty" } = {},
): string {
  const missingToken = options.missingToken ?? "throw";
  const tokenPattern = /\{(\w+)\}/g;
  const missingTokens = new Set<string>();

  for (const match of template.matchAll(tokenPattern)) {
    const key = match[1];
    const value = tokens[key];
    if (value == null || value === "") {
      missingTokens.add(key);
    }
  }

  if (missingToken === "throw" && missingTokens.size > 0) {
    throw new Error(
      `Missing template token(s): ${Array.from(missingTokens).join(", ")}`,
    );
  }

  return template.replace(tokenPattern, (_match, key: string) => {
    const value = tokens[key];
    if (value == null || value === "") return "";
    return String(value);
  });
}
