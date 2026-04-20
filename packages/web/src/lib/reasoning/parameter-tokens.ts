import { parameters, type Parameter, type ParameterName } from "@optimitron/data/parameters";

export const PARAMETER_TOKEN_RE = /\{([A-Z][A-Z0-9_]+)\}/g;

export function isKnownParameterName(value: string): value is ParameterName {
  return value in parameters;
}

export function resolveParameterByName(value: string): Parameter | null {
  return isKnownParameterName(value) ? parameters[value] : null;
}

export function extractParameterTokenNames(text: string): string[] {
  const matches = text.matchAll(PARAMETER_TOKEN_RE);
  return Array.from(matches, (match) => match[1] ?? "");
}

export function stripParameterTokens(text: string): string {
  return text.replace(PARAMETER_TOKEN_RE, "");
}

