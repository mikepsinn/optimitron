"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll } from "framer-motion";

interface SpineChapter {
  id: string;
  label: string;
}

/**
 * Fixed chapter rail (desktop) plus a "cast your vote" nudge that appears
 * after half the essay is read and retires when the finale is on screen.
 * Both promise the same thing: this page has an end, and the end is a vote.
 */
export function ProgressSpine({
  chapters,
  voteHref,
}: {
  chapters: SpineChapter[];
  voteHref: string;
}) {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    // Fixed elements smear across full-page screenshot stitching; the nudge
    // is a scroll-time enhancement, so automation never needs it.
    if (navigator.webdriver) return;
    return scrollYProgress.on("change", (progress) => {
      setShowNudge(progress > 0.45 && progress < 0.88);
    });
  }, [scrollYProgress]);

  return (
    <>
      <nav
        aria-label="Chapters"
        className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
      >
        <div className="relative flex flex-col gap-6 border-l-2 border-foreground/20 pl-4">
          <motion.span
            aria-hidden="true"
            className="absolute -left-0.5 top-0 h-full w-0.5 origin-top bg-foreground"
            style={
              prefersReducedMotion ? undefined : { scaleY: scrollYProgress }
            }
          />
          {chapters.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
            >
              {chapter.label}
            </a>
          ))}
        </div>
      </nav>

      <a
        href={voteHref}
        aria-hidden={!showNudge}
        tabIndex={showNudge ? 0 : -1}
        className={`fixed bottom-0 left-0 right-0 z-40 border-t-2 border-foreground bg-background px-4 py-3 text-center text-xs font-black uppercase tracking-[0.25em] text-foreground transition-transform duration-300 hover:bg-foreground hover:text-background sm:text-sm ${
          showNudge ? "translate-y-0" : "translate-y-full"
        }`}
      >
        ↓ This ends with a vote. Skip ahead and cast it.
      </a>
    </>
  );
}
