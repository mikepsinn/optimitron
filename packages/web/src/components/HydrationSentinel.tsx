"use client";

import { useEffect } from "react";

/**
 * Marks the document hydrated so automated capture can wait for a real signal
 * instead of guessing at a timeout.
 *
 * Several components render nothing until after hydration on purpose --
 * anything using `useHydratedNow` has to, or the server's clock and the
 * browser's clock would disagree and React would blow up the tree. The copy
 * snapshotter used to wait a flat 400ms, which is not enough for a page as
 * heavy as /game in dev, so those blocks were silently absent from the
 * recorded copy. A snapshot missing a whole section is worse than no snapshot,
 * because it reads as "this text was deleted".
 *
 * Effects run after paint and in mount order, so by the time this fires the
 * hydration-gated content above it has already rendered.
 */
export function HydrationSentinel() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
    return () => {
      delete document.documentElement.dataset.hydrated;
    };
  }, []);

  return null;
}
