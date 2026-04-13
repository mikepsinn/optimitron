export function renderTemplate(
  template: string,
  tokens: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = tokens[key];
    if (value == null) return "";
    return String(value);
  });
}
