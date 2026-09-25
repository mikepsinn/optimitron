"use client";

import { useLiveMotion } from "./use-live-motion";

/**
 * The signal travelling around a control-loop diagram. SVG `<animateMotion>`
 * ignores the CSS that visual capture uses to freeze animations, so outside
 * live motion the dot sits still at the start of its path.
 */
export function LoopDot({
  durationSeconds,
  fadeOut = false,
  path,
  start,
}: {
  durationSeconds: number;
  fadeOut?: boolean;
  path: string;
  start: readonly [x: number, y: number];
}) {
  const live = useLiveMotion();
  const className = "fill-brutal-cyan";

  if (!live) {
    return <circle className={className} cx={start[0]} cy={start[1]} r={5} />;
  }

  return (
    <circle className={className} r={5}>
      <animateMotion
        dur={`${durationSeconds}s`}
        path={path}
        repeatCount="indefinite"
      />
      {fadeOut ? (
        <animate
          attributeName="opacity"
          dur={`${durationSeconds}s`}
          keyTimes="0;0.8;1"
          repeatCount="indefinite"
          values="1;1;0"
        />
      ) : null}
    </circle>
  );
}
