export type PageParamValue =
  | string
  | readonly (string | undefined)[]
  | undefined;

export function parsePositivePageParam(value: PageParamValue) {
  const raw = Number.parseInt(
    Array.isArray(value) ? (value[0] ?? "1") : (value ?? "1"),
    10,
  );
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}
