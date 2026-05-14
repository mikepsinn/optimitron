import React from "react";
import { EMAIL_STYLES } from "@/components/adaptive/email-styles";
import {
  formatParameterValueText,
  type ParameterValueProps,
} from "@/components/shared/ParameterValue.core";

export function ParameterValueEmail({
  className: _className,
  display = "auto",
  figures = 3,
  param,
  presentation: _presentation,
  valueOverride,
}: ParameterValueProps) {
  const text = formatParameterValueText({
    display,
    figures,
    param,
    valueOverride,
  });

  if (!param.manualPageUrl) {
    return <span>{text}</span>;
  }

  return (
    <a href={param.manualPageUrl} style={EMAIL_STYLES.parameterLink}>
      {text}
    </a>
  );
}
