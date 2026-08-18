export type PageParamValue =
  | string
  | readonly (string | undefined)[]
  | undefined;

export function parsePositivePageParam(value: PageParamValue) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const normalized = candidate?.trim() ?? "";
  if (!/^[1-9]\d*$/.test(normalized)) return 1;
  return Number(normalized);
}
