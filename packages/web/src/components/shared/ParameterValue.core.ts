import {
  citations,
  fmtParam,
  fmtParamValueOnly,
  type Citation,
  type Parameter,
} from "@optimitron/data/parameters";

export interface ParameterValueProps {
  /** The parameter object to display */
  param: Parameter;
  /** How to display the value (default "auto")
   *  - "auto": value only, no unit suffix (fmtParamValueOnly)
   *  - "integer": Math.round(value), no suffixes
   *  - "withUnit": full formatted value with unit (fmtParam)
   */
  display?: "auto" | "integer" | "withUnit";
  /** Significant figures (default 3) */
  figures?: number;
  /** Web presentation (default "interactive"). Email always stays link-safe. */
  presentation?: "interactive" | "inline";
  /** Additional CSS classes for the value */
  className?: string;
  /**
   * Override the rendered text (metadata details still use `param`). Useful
   * when the displayed value is derived from `param` but needs custom
   * formatting the auto-formatter can't express — e.g., a percentage
   * computed from a ratio with a fixed decimal count.
   */
  valueOverride?: string;
}

export function formatParameterValueText({
  display = "auto",
  figures = 3,
  param,
  valueOverride,
}: Pick<
  ParameterValueProps,
  "display" | "figures" | "param" | "valueOverride"
>) {
  if (valueOverride) return valueOverride;

  switch (display) {
    case "integer":
      return String(Math.round(param.value));
    case "withUnit":
      return fmtParam(param, figures);
    default:
      return fmtParamValueOnly(param, figures);
  }
}

export function getParameterCitation(param: Parameter): Citation | undefined {
  return param.sourceRef ? citations[param.sourceRef] : undefined;
}

export function getParameterReferenceUrl(param: Parameter): string | null {
  return param.manualPageUrl ?? param.calculationsUrl ?? null;
}

export function hasParameterMetadata(param: Parameter) {
  const citation = getParameterCitation(param);
  return [
    param.displayName,
    param.description,
    param.formula,
    param.latex,
    citation?.title,
    param.confidence,
    param.calculationsUrl,
    param.manualPageUrl,
    param.peerReviewed,
    param.conservative,
    param.confidenceInterval,
  ].some(Boolean);
}
