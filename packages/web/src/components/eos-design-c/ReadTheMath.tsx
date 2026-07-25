import type { ReactNode } from "react";

/**
 * Every screen leads with a number, a drawing, or a demo. The prose that
 * justifies it goes in here. Native <details> so it works without JS and
 * stays keyboard-navigable.
 */
export function ReadTheMath({
  label = "Read the math",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <details className="dc-math">
      <summary className="dc-slate">{label}</summary>
      <div className="dc-math-body">{children}</div>
    </details>
  );
}
