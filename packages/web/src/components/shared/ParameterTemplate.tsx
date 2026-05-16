import { Fragment, type ReactNode } from "react";

const PARAMETER_TOKEN_PATTERN = /\{([A-Z0-9_]+)\}/g;

export function ParameterTemplate({
  template,
  values,
}: {
  template: string;
  values: Partial<Record<string, ReactNode>>;
}) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of template.matchAll(PARAMETER_TOKEN_PATTERN)) {
    const [placeholder, token] = match;
    const index = match.index ?? 0;

    if (!token) {
      throw new Error(`Invalid ParameterTemplate token in ${template}`);
    }

    if (index > lastIndex) {
      parts.push(template.slice(lastIndex, index));
    }

    const value = values[token];
    if (value === undefined) {
      throw new Error(`Missing ParameterTemplate value for ${token}`);
    }

    parts.push(value);
    lastIndex = index + placeholder.length;
  }

  if (lastIndex < template.length) {
    parts.push(template.slice(lastIndex));
  }

  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>{part}</Fragment>
      ))}
    </>
  );
}
