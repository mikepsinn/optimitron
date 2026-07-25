"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The register shift. Section 1 is dark and airless; this block cuts a hard
 * cream arc up through the black and the 1950s catalog floods in. The edge is a
 * die cut, not a fade, so the change reads as walking out of a courtroom rather
 * than a lighting adjustment.
 */
export function Pivot() {
  const ref = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setOpen(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setOpen(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={`dsa-pivot${open ? " is-open" : ""}`}
      aria-label="Earth Optimization Services"
    >
      <div className="dsa-wrap dsa-pivot-inner">
        <p className="dsa-pivot-q">
          Has your species developed nuclear weapons, antibiotics, and the
          internet, and then pointed two of those three at each other?
        </p>
        <p className="dsa-pivot-a">You may be eligible for optimization.</p>
        <span className="dsa-pivot-badge" aria-hidden="true">
          Over 300 planets optimized
        </span>
      </div>
    </section>
  );
}
