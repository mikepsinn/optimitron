"use client";

import { Fragment, type ReactNode } from "react";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  PARAMETER_TOKEN_RE,
  resolveParameterByName,
} from "@/lib/reasoning/parameter-tokens";

type ParameterizedTextProps = {
  text: string;
  display?: "auto" | "integer" | "withUnit";
  valueClassName?: string;
};

export function ParameterizedText({
  text,
  display = "auto",
  valueClassName,
}: ParameterizedTextProps) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(PARAMETER_TOKEN_RE)) {
    const start = match.index ?? 0;
    const fullMatch = match[0];
    const paramName = match[1] ?? "";

    if (start > lastIndex) {
      parts.push(
        <Fragment key={`text-${lastIndex}`}>
          {renderPlainText(text.slice(lastIndex, start))}
        </Fragment>,
      );
    }

    const param = resolveParameterByName(paramName);
    parts.push(
      <Fragment key={`param-${start}`}>
        {param ? (
          <ParameterValue
            param={param}
            display={display}
            className={valueClassName}
          />
        ) : (
          fullMatch
        )}
      </Fragment>,
    );

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <Fragment key={`text-${lastIndex}`}>
        {renderPlainText(text.slice(lastIndex))}
      </Fragment>,
    );
  }

  return <>{parts}</>;
}

function renderPlainText(text: string): ReactNode {
  const segments = text.split("\n");
  return segments.map((segment, index) => (
    <Fragment key={`${segment}-${index}`}>
      {index > 0 ? <br /> : null}
      {segment}
    </Fragment>
  ));
}
