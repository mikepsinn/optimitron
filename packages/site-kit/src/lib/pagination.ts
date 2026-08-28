export type PageParamValue =
  | string
  | readonly (string | undefined)[]
  | undefined;

export function parsePositivePageParam(value: PageParamValue) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const normalized = candidate?.trim() ?? "";
  if (!/^[1-9]\d*$/.test(normalized)) return 1;
  // The pattern admits digit strings of any length, and Number() turns a long
  // enough one into Infinity or rounds it past MAX_SAFE_INTEGER.
  const page = Number(normalized);
  return Number.isSafeInteger(page) ? page : 1;
}
